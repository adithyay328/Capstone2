"use client";
import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";
import SevenSegment from "./SevenSegment";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "@/components/sidebar"; //left sidebar
import RegisterVisualPanel from "@/components/RegisterVisualPanel"; //seven
import RegisterEditor from "@/components/register-editor";
import HelpModal from "@/components/help-modal";
import { listLabs } from "@/app/api/list_labs/frontend";
import { Lab } from "@/app/api/list_labs/types";
import { listTestCases } from "@/app/api/list_test_cases/frontend";
import { scoreTestCase } from "@/app/api/score/frontend";
import { getGradeStatus } from "@/app/api/grade_status/frontend";
import { syncLabSession } from "@/app/api/sync_lab_session/frontend";
import { loadLabSession } from "@/app/api/load_lab_session/frontend";
import useRunner from "@/components/use-runner";
import type {
  AssemblyInfoData,
  ProjectState,
  SimState,
  SubmitResponse,
} from "@/components/types";

// Dynamically import the markdown preview to avoid SSR issues
const MdPreview = dynamic(
  () => import("md-editor-rt").then((mod) => mod.MdPreview),
  { ssr: false }
);

// Import the CSS for the markdown preview
import "md-editor-rt/lib/preview.css";

//key for the app
const LS_KEY = "riscv-lab-session";

type SavedVersion = {
  uid: string;
  labUid?: string;
  version?: number;
  code: string;
  resp: AssemblyInfoData | null;
  simState: SimState | null;
  stepIndex: number;
  allStates: SubmitResponse["states"];
  registerOverrides: Record<string, string>;
};

//BACKEND MUST MATCH THIS
function makeUid() {
  return "uid-" + Math.random().toString(36).slice(2);
}

export default function LabRoot() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const labUidFromQuery = searchParams.get("lab") ?? "";
  const storageKey = React.useMemo(
    () => (labUidFromQuery ? `${LS_KEY}:${labUidFromQuery}` : LS_KEY),
    [labUidFromQuery]
  );
  const [uid, setUid] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [memory, setMemory] = React.useState("");
  const [resp, setResp] = React.useState<AssemblyInfoData | null>(null);
  const [stepsEngaged, setStepsEngaged] = React.useState(false); 
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [simState, setSimState] = React.useState<SimState | null>(null);
  const [allStates, setAllStates] = React.useState<SubmitResponse["states"]>([]);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [registerOverrides, setRegisterOverrides] = React.useState<Record<string, string>>({});
  const [initStatus, setInitStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [initError, setInitError] = React.useState<string | null>(null);

  const defaultRegisters = React.useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: 32 }, (_, i) => [`x${i}`, "0x0"])
      ),
    []
  );

  const uiRegisters = React.useMemo(
    () => ({
      ...defaultRegisters,
      ...registerOverrides,
    }),
    [defaultRegisters, registerOverrides]
  );

  // Labs for grading
  const [labs, setLabs] = React.useState<Lab[]>([]);
  const [selectedLabUid, setSelectedLabUid] = React.useState<string>("");
  const [selectedLab, setSelectedLab] = React.useState<Lab | null>(null);
  const [sidePanelTab, setSidePanelTab] = React.useState<"instructions" | "registers">(
    "instructions"
  );
  const [gradeAttemptsUsed, setGradeAttemptsUsed] = React.useState<number | null>(null);
  const [gradeAttemptsRemaining, setGradeAttemptsRemaining] = React.useState<number | null>(null);
  const [gradeAttemptsLimit, setGradeAttemptsLimit] = React.useState<number>(5);
  const [isGrading, setIsGrading] = React.useState(false);
  const [gradeCooldownSeconds, setGradeCooldownSeconds] = React.useState(0);

  const [runMeta, setRunMeta] = React.useState<{ hadError: boolean; errorMessage: string }>({
    hadError: false,
    errorMessage: "",
  });

  const labSessionDirtyRef = React.useRef(false);

  const buildLabSessionPayload = React.useCallback((overrides?: { storageKey?: string; labUid?: string | null }) => {
    if (!uid) return null;
    return {
      storageKey: overrides?.storageKey ?? storageKey,
      uid,
      labUid: overrides?.labUid ?? (labUidFromQuery || null),
      version: 1,
      code,
      resp,
      simState,
      stepIndex,
      allStates,
      registerOverrides,
    };
  }, [
    uid,
    storageKey,
    labUidFromQuery,
    code,
    resp,
    simState,
    stepIndex,
    allStates,
    registerOverrides,
  ]);

  const syncLabSessionNow = React.useCallback(
    async (
      useBeacon = false,
      force = false,
      overrides?: { storageKey?: string; labUid?: string | null }
    ) => {
      if (!labSessionDirtyRef.current && !force) return;
      const payload = buildLabSessionPayload(overrides);
      if (!payload) return;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const ok = navigator.sendBeacon(
          "/api/sync_lab_session",
          JSON.stringify({ session: payload })
        );
        if (ok) {
          labSessionDirtyRef.current = false;
        }
        return;
      }

      const result = await syncLabSession(payload);
      if (result.success) {
        labSessionDirtyRef.current = false;
      }
    },
    [buildLabSessionPayload]
  );

  const prevStorageKeyRef = React.useRef<string | null>(null);
  const prevLabUidRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const prevKey = prevStorageKeyRef.current;
    const prevLabUid = prevLabUidRef.current;
    if (prevKey && prevKey !== storageKey) {
      void syncLabSessionNow(false, true, { storageKey: prevKey, labUid: prevLabUid });
    }
    prevStorageKeyRef.current = storageKey;
    prevLabUidRef.current = labUidFromQuery || null;
  }, [labUidFromQuery, storageKey, syncLabSessionNow]);

  React.useEffect(() => {
    return () => {
      void syncLabSessionNow(true, true);
    };
  }, [syncLabSessionNow]);

  // LOADS LOCAL STORAGE (scoped per lab)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const applySession = (parsed: SavedVersion) => {
      if (cancelled) return;
      setUid(parsed.uid ?? makeUid());

      if (typeof parsed.code === "string") {
        setCode(parsed.code);
      } else {
        setCode("");
      }

      if (parsed.resp) setResp(parsed.resp);
      else setResp(null);
      if (parsed.simState) setSimState(parsed.simState);
      else setSimState(null);
      if (Array.isArray(parsed.allStates)) setAllStates(parsed.allStates);
      else setAllStates([]);
      if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
      else setStepIndex(0);
        setRegisterOverrides(
          parsed.registerOverrides && typeof parsed.registerOverrides === "object"
            ? parsed.registerOverrides
            : ({} as Record<string, string>)
        );
    };

    const applyFresh = (): SavedVersion => {
      const freshUid = makeUid();
      const fresh: SavedVersion = {
        uid: freshUid,
        labUid: labUidFromQuery || undefined,
        version: 1,
        code: "",
        resp: null,
        simState: null,
        stepIndex: 0,
        allStates: [],
        registerOverrides: {} as Record<string, string>,
      };
      applySession(fresh);
      return fresh;
    };

    const hydrate = async () => {
      setInitStatus("loading");
      setInitError(null);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setInitStatus("error");
        setInitError("Initial connection required. Check your internet connection and reload.");
        return;
      }

      const remote = await loadLabSession(storageKey);
      if (cancelled) return;

      if (!remote.success) {
        setInitStatus("error");
        setInitError(remote.message ?? "Unable to connect to the database.");
        return;
      }

      if (remote.session) {
        const registerOverrides =
          (remote.session.registerOverrides ?? {}) as Record<string, string>;
        const parsed: SavedVersion = {
          uid: remote.session.uid ?? makeUid(),
          labUid: remote.session.labUid ?? undefined,
          version: remote.session.version ?? 1,
          code: remote.session.code ?? "",
          resp: remote.session.resp ?? null,
          simState: remote.session.simState ?? null,
          stepIndex: remote.session.stepIndex ?? 0,
          allStates: Array.isArray(remote.session.allStates)
            ? remote.session.allStates
            : [],
          registerOverrides,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(parsed));
        applySession(parsed);
        setInitStatus("ready");
        return;
      }

      const fresh = applyFresh();
      window.localStorage.setItem(storageKey, JSON.stringify(fresh));
      await syncLabSession({
        storageKey,
        uid: fresh.uid,
        labUid: labUidFromQuery || null,
        version: 1,
        code: fresh.code,
        resp: fresh.resp,
        simState: fresh.simState,
        stepIndex: fresh.stepIndex,
        allStates: fresh.allStates,
        registerOverrides: fresh.registerOverrides,
      });
      setInitStatus("ready");
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [storageKey, labUidFromQuery]);

  //HELPER to write everything to local storage
  const persist = React.useCallback(
    (next: Partial<SavedVersion> = {}) => {
      if (typeof window === "undefined") return;

      const payload: SavedVersion = {
        uid,
        labUid: labUidFromQuery || undefined,
        version: 1,
        code,
        resp,
        simState,
        stepIndex,
        allStates,
        registerOverrides,
        ...next,
      };

      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    [uid, code, resp, simState, stepIndex, allStates, registerOverrides, storageKey, labUidFromQuery]
  );
  

  //changes site based on any changes to the paramters in []
  React.useEffect(() => {
    if (!uid) return;
    persist();
  }, [uid, code, resp, simState, registerOverrides, persist]);

  React.useEffect(() => {
    if (!uid) return;
    labSessionDirtyRef.current = true;
  }, [uid, storageKey, code, resp, simState, stepIndex, allStates, registerOverrides]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => {
      void syncLabSessionNow();
    }, 3 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [syncLabSessionNow]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePageHide = () => {
      void syncLabSessionNow(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void syncLabSessionNow(true);
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncLabSessionNow]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      void syncLabSessionNow();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [syncLabSessionNow]);

  // Fetch labs on mount for grading dropdown
  React.useEffect(() => {
    async function fetchLabs() {
      const response = await listLabs();
      if (response.success && response.labs) {
        setLabs(response.labs);
      }
    }
    fetchLabs();
  }, []);

  // Sync lab selection from URL
  React.useEffect(() => {
    if (!labUidFromQuery) return;
    setSelectedLabUid(labUidFromQuery);
  }, [labUidFromQuery]);

  // Resolve selected lab content
  React.useEffect(() => {
    if (!selectedLabUid) {
      setSelectedLab(null);
      return;
    }
    const found = labs.find((lab) => lab.uid === selectedLabUid) ?? null;
    setSelectedLab(found);
  }, [labs, selectedLabUid]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadGradeStatus() {
      if (!selectedLabUid) return;
      const status = await getGradeStatus(selectedLabUid);
      if (cancelled) return;
      if (typeof status.attemptsLimit === "number") {
        setGradeAttemptsLimit(status.attemptsLimit);
      }
      if (typeof status.attemptsUsed === "number") {
        setGradeAttemptsUsed(status.attemptsUsed);
      }
      if (typeof status.attemptsRemaining === "number") {
        setGradeAttemptsRemaining(status.attemptsRemaining);
      }
    }
    loadGradeStatus();
    return () => {
      cancelled = true;
    };
  }, [selectedLabUid]);

  React.useEffect(() => {
    if (gradeCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setGradeCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [gradeCooldownSeconds]);

  //when code changes in editor we update current version (or create one)
  const handleCodeChange = (nextCode: string) => {

    setCode(nextCode);
    persist({ code: nextCode });
  };

  const persistRunner = React.useCallback(
    (next?: Partial<ProjectState>) => {
      if (!next) return;
      persist({
        allStates: next.allStates ?? allStates,
        stepIndex: next.stepIndex ?? stepIndex,
        resp: next.resp ?? resp,
        simState: next.simState ?? simState,
      });
    },
    [persist, allStates, stepIndex, resp, simState]
  );

  const {
    handleRun,
    handleStop,
    handleStart,
    handleStepForward,
    handleStepBack,
    resetSession,
  } = useRunner({
    code,
    allStates,
    runMeta,
    registersForRun: uiRegisters,
    persist: persistRunner,
    setAllStates,
    setStepIndex,
    setResp,
    setRunMeta,
    setFatalError,
    setStepsEngaged,
  });

  const handleReset = React.useCallback(() => {
    setRegisterOverrides({});
    resetSession({ registerOverrides: {} });
  }, [resetSession]);

  const handleNewProject = React.useCallback(async () => {
    await syncLabSessionNow(false, true);
    router.push("/student/new-project");
  }, [router, syncLabSessionNow]);

  const handleOpenProjects = React.useCallback(async () => {
    await syncLabSessionNow(false, true);
    router.push("/student/projects");
  }, [router, syncLabSessionNow]);

  // Grade the current code against all test cases for the selected lab
  async function handleGrade(): Promise<boolean> {
    if (!code.trim()) {
      toast.error("No code to grade!");
      return false;
    }

    if (!selectedLabUid) {
      toast.error("Please select a lab to grade!");
      return false;
    }

    // Find the selected lab
    const lab = selectedLab ?? labs.find(l => l.uid === selectedLabUid);
    if (!lab) {
      toast.error("Selected lab not found");
      return false;
    }

    try {
      const testCasesResponse = await listTestCases(lab.uid);
      if (!testCasesResponse.success || !testCasesResponse.testCases) {
        toast.error(`Failed to fetch test cases for ${lab.title}`);
        return false;
      }

      // If no test cases, show info
      if (testCasesResponse.testCases.length === 0) {
        toast.info(`Lab ${lab.title}: No test cases`);
        return false;
      }

      // Score each test case (single grade session)
      const gradeSessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `grade-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      let didRequest = false;
      let allPassed = true;
      for (const testCase of testCasesResponse.testCases) {
        didRequest = true;
        const scoreResponse = await scoreTestCase(code, testCase.uid, gradeSessionId);
        if (typeof scoreResponse.attemptsLimit === "number") {
          setGradeAttemptsLimit(scoreResponse.attemptsLimit);
        }
        if (typeof scoreResponse.attemptsUsed === "number") {
          setGradeAttemptsUsed(scoreResponse.attemptsUsed);
        }
        if (typeof scoreResponse.attemptsRemaining === "number") {
          setGradeAttemptsRemaining(scoreResponse.attemptsRemaining);
        }
        if (scoreResponse.error && scoreResponse.error.toLowerCase().includes("limit")) {
          toast.error(scoreResponse.error);
          return didRequest;
        }
        if (!scoreResponse.pass) {
          allPassed = false;
          break;
        }
      }

      // Show toast for this lab
      if (allPassed) {
        toast.success(`Lab ${lab.title}: PASSED!`);
      } else {
        toast.error(`Lab ${lab.title}: FAILED!`);
      }
      return didRequest;
    } catch (error) {
      console.error("Grade error:", error);
      toast.error("An error occurred while grading");
      return false;
    }
  }

  const gradeBlockedByLimit =
    gradeAttemptsRemaining !== null && gradeAttemptsRemaining <= 0;
  const isGradeCoolingDown = gradeCooldownSeconds > 0;
  const gradeDisabled =
    !selectedLabUid || gradeBlockedByLimit || isGrading || isGradeCoolingDown;
  const gradeLabel = isGrading
    ? "Grading..."
    : isGradeCoolingDown
      ? `Grade (${gradeCooldownSeconds}s)`
      : "Grade";

  if (initStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(82,82,82)] text-zinc-100 px-6">
        <div className="max-w-lg rounded border border-red-500/40 bg-red-950/30 p-6 text-sm">
          <div className="font-semibold mb-2">Unable to connect</div>
          <div>{initError ?? "Initial connection required. Check your internet connection."}</div>
        </div>
      </div>
    );
  }

  if (initStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(82,82,82)] text-zinc-100 px-6">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-500 border-t-transparent animate-spin" />
      </div>
    );
  }

return (
  <div className="relative min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex ml-7">
    <ToastContainer position="top-right" autoClose={5000} aria-label="container" />
          {/* LEFT SIDEBAR */}
      <Sidebar
        initialOpen={false}
        onNewProject={handleNewProject}
        onOpenProjects={handleOpenProjects}
      />
      <HelpModal title="AI Helper Chatbot">
        <p>Potential Chatgpt??</p>
        <p>Like SensAI to help students find out whats going on?</p>
      </HelpModal>
    <div className="w-full max-w-[100rem] mx-auto pl-4 pr-4 sm:px-6 md:px-8 md:pl-20 md:pr-16 pt-4">
      <div className="mb-3 w-full max-w-[44rem] sm:min-w-[26.875rem] min-w-0">
        <Link
          href="/student/labs"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z" />
          </svg>
          Lab Home
        </Link>
      </div>
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Editor + controls column */}
        <div className="w-full max-w-[46.875rem] sm:min-w-[26.875rem] min-w-0 flex flex-col">
        {/* EDITOR */}
        <CodeEditor
          code={code}
          onChange={handleCodeChange}
          //currentLine={simState?.currentLine ?? null}
        />

        {/* CONTROLS under editor */}
        <div className="flex flex-wrap gap-3 items-center mt-5">
          {/* keep all 5 of your buttons */}
          <button
            onClick={handleRun}
            className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900 disabled:opacity-50"
            //disabled={stepsEngaged}
          >
            Run
          </button>

          {stepsEngaged ? (
            <button
              onClick={() => handleStop()}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => handleStart()}
              className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Start
            </button>
          )}

          <button
            onClick={() => handleStepForward()}
            className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            disabled={!stepsEngaged || allStates.length===0 || stepIndex >= allStates.length - 1}
          >
            Step
          </button>

          <button
            onClick={() => handleStepBack()}
            className="rounded border px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
            disabled={!stepsEngaged || stepIndex===0 || allStates.length===0}
          >
            Back Step
          </button>

          <button
            onClick={() => handleReset()}
            className="rounded border px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
            //disabled={stepsEngaged}
          >
            Reset
          </button>

          <button
            onClick={async () => {
              if (gradeDisabled) return;
              setIsGrading(true);
              const didRequest = await handleGrade();
              setIsGrading(false);
              if (didRequest) {
                setGradeCooldownSeconds(30);
              }
            }}
            className={`rounded px-4 py-2 text-white ${
              gradeDisabled
                ? isGrading || isGradeCoolingDown
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={gradeDisabled}
          >
            {gradeLabel}
          </button>
          <span className="text-xs text-zinc-300">
            Grades left: {gradeAttemptsRemaining ?? gradeAttemptsLimit}/{gradeAttemptsLimit}
          </span>

          <button
            onClick={() => void syncLabSessionNow(false, true)}
            className="rounded border px-3 py-2 text-xs hover:bg-zinc-100"
          >
            Sync Now
          </button>

          {/* uid (kept from Version 1) */}
          <span className="ml-auto text-xs text-zinc-500">
            {uid}
          </span>
        </div>

        {/* fatal error box (optional, like Version 2) */}
        {fatalError && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {fatalError}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <AssemblyInfo response={resp} />
          <div className="flex-shrink-0">
            <RegisterVisualPanel
              registers={resp?.registers ?? null}
              track="x1"
              digits={4}
            />
          </div>
        </div>
      </div>

      {/* Right column (tabbed lab panel) */}
      <div className="w-full xl:w-[32rem] 2xl:w-[42.5rem] min-w-0 mt-5 xl:mt-0">
        <div className="rounded-md border border-zinc-700 bg-zinc-900/40 h-[48.65rem] flex flex-col overflow-hidden">
          <div className="flex border-b border-zinc-700 text-sm">
            <button
              type="button"
              onClick={() => setSidePanelTab("instructions")}
              className={`flex-1 px-3 py-2 text-center font-medium ${
                sidePanelTab === "instructions"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              Lab Instructions
            </button>
            <button
              type="button"
              onClick={() => setSidePanelTab("registers")}
              className={`flex-1 px-3 py-2 text-center font-medium ${
                sidePanelTab === "registers"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              Register Presets
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidePanelTab === "instructions" ? (
              <div className="h-full bg-white text-zinc-900 p-4 flex flex-col">
                <div className="mb-2 ">
                  {selectedLab?.title && (
                    <p className="text-lg font-bold text-zinc-900 ">
                      {selectedLab.title}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md ">
                  {selectedLab ? (
                    typeof window !== "undefined" && (
                      <MdPreview modelValue={selectedLab.md} language="en-US" />
                    )
                  ) : (
                    <p className="p-4 text-sm text-gray-500">
                      Select a lab to view instructions.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full p-4 flex flex-col">
                <h2 className="font-semibold text-sm uppercase tracking-wide">
                  Register Presets
                </h2>
                <div className="mt-2 flex-1 overflow-y-auto">
                  <RegisterEditor
                    registers={uiRegisters}
                    disabled={stepsEngaged}
                    onChange={(key, value) =>
                      setRegisterOverrides((prev) => {
                        const next = { ...prev };
                        if (!value.trim()) {
                          delete next[key];
                        } else {
                          next[key] = value;
                        }
                        return next;
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  </div>
  </div>
);

};
