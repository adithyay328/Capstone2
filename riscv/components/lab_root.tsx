"use client";
import React from "react";
import { useRouter } from "next/navigation";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";
import SevenSegment from "./SevenSegment";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "@/components/sidebar"; //left sidebar
import RegisterVisualPanel from "@/components/RegisterVisualPanel"; //seven
import { listLabs } from "@/app/api/list_labs/frontend";
import { Lab } from "@/app/api/list_labs/types";
import { listTestCases } from "@/app/api/list_test_cases/frontend";
import { scoreTestCase } from "@/app/api/score/frontend";
import useRunner from "@/components/use-runner";
import type {
  AssemblyInfoData,
  ProjectState,
  SimState,
  SubmitResponse,
} from "@/components/types";

//key for the app
const LS_KEY = "riscv-lab-session";

type SavedVersion = {
  uid: string;
  code: string;
  resp: AssemblyInfoData | null;
  simState: SimState | null;
  stepIndex: number;
  allStates: SubmitResponse["states"];
};

//BACKEND MUST MATCH THIS
function makeUid() {
  return "uid-" + Math.random().toString(36).slice(2);
}

export default function LabRoot() {
  const router = useRouter();
  const [uid, setUid] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [memory, setMemory] = React.useState("");
  const [resp, setResp] = React.useState<AssemblyInfoData | null>(null);
  const [stepsEngaged, setStepsEngaged] = React.useState(false); 
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [simState, setSimState] = React.useState<SimState | null>(null);
  const [allStates, setAllStates] = React.useState<SubmitResponse["states"]>([]);
  const [stepIndex, setStepIndex] = React.useState(0);

  // Labs for grading
  const [labs, setLabs] = React.useState<Lab[]>([]);
  const [selectedLabUid, setSelectedLabUid] = React.useState<string>("");

  const [runMeta, setRunMeta] = React.useState<{ hadError: boolean; errorMessage: string }>({
    hadError: false,
    errorMessage: "",
  });


  //LOADS LOCAL STORAGE
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(LS_KEY);
    const legacyRaw = raw ? null : window.localStorage.getItem("riscv-session");
    const payload = raw ?? legacyRaw;
    if (payload) {
      try {
        const parsed: SavedVersion = JSON.parse(payload);
        const isLegacyWorkspace = !raw && legacyRaw && parsed && !("code" in parsed);
        if (isLegacyWorkspace) {
          throw new Error("legacy workspace data detected");
        }

        // uid
        setUid(parsed.uid ?? makeUid());

        // code
        if (typeof parsed.code === "string") {
          setCode(parsed.code);
        }

        // restore resp + simState (so right panel + highlighting show up)
        if (parsed.resp) setResp(parsed.resp);
        if (parsed.simState) setSimState(parsed.simState);
        if (Array.isArray(parsed.allStates)) setAllStates(parsed.allStates);
        if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);

      } catch (e) {
        console.warn("bad local session, resetting", e);
        const freshUid = makeUid();
        setUid(freshUid);
        setCode("");
      }
    } else {
      // first time
      const freshUid = makeUid();
      setUid(freshUid);
      setCode("");
    }
  }, []);

  //HELPER to write everything to local storage
  const persist = React.useCallback(
    (next: Partial<SavedVersion> = {}) => {
      if (typeof window === "undefined") return;

      const payload: SavedVersion = {
        uid,
        code,
        resp,
        simState,
        stepIndex,
        allStates,
        ...next,
      };

      window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    },
    [uid, code, resp, simState, stepIndex, allStates]
  );
  

  //changes site based on any changes to the paramters in []
  React.useEffect(() => {
    if (!uid) return;
    persist();
  }, [uid, code, resp, simState, persist]);

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
    handleStart,
    handleStepForward,
    handleStepBack,
    resetSession,
  } = useRunner({
    code,
    allStates,
    runMeta,
    persist: persistRunner,
    setAllStates,
    setStepIndex,
    setResp,
    setRunMeta,
    setFatalError,
    setStepsEngaged,
  });

  const handleNewProject = React.useCallback(() => {
    router.push("/student/new-project");
  }, [router]);

  const handleOpenProjects = React.useCallback(() => {
    router.push("/student/projects");
  }, [router]);

  // Grade the current code against all test cases for the selected lab
  async function handleGrade() {
    if (!code.trim()) {
      toast.error("No code to grade!");
      return;
    }

    if (!selectedLabUid) {
      toast.error("Please select a lab to grade!");
      return;
    }

    // Find the selected lab
    const lab = labs.find(l => l.uid === selectedLabUid);
    if (!lab) {
      toast.error("Selected lab not found");
      return;
    }

    try {
      const testCasesResponse = await listTestCases(lab.uid);
      if (!testCasesResponse.success || !testCasesResponse.testCases) {
        toast.error(`Failed to fetch test cases for ${lab.title}`);
        return;
      }

      // If no test cases, show info
      if (testCasesResponse.testCases.length === 0) {
        toast.info(`Lab ${lab.title}: No test cases`);
        return;
      }

      // Score each test case
      let allPassed = true;
      for (const testCase of testCasesResponse.testCases) {
        const scoreResponse = await scoreTestCase(code, testCase.uid);
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
    } catch (error) {
      console.error("Grade error:", error);
      toast.error("An error occurred while grading");
    }
  }


return (
  <div className="relative min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
    <ToastContainer position="top-right" autoClose={5000} aria-label="container" />
          {/* LEFT SIDEBAR */}
      <Sidebar
        initialOpen={false}
        onNewProject={handleNewProject}
        onOpenProjects={handleOpenProjects}
      />
    <div className="flex flex-col md:flex-row md:flex-wrap gap-30 px-4 mt-4 pl-20">
      {/* Editor + controls column */}
      <div className="w-full md:w-[65vw] lg:w-[70vw] xl:w-[75vw] mt-5 mb-[-10]">
        {/* EDITOR */}
        <CodeEditor
          code={code}
          onChange={handleCodeChange}
          //currentLine={simState?.currentLine ?? null}
        />

        {/* CONTROLS under editor */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* keep all 5 of your buttons */}
          <button
            onClick={handleRun}
            className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900 disabled:opacity-50"
            //disabled={stepsEngaged}
          >
            Run
          </button>

          <button
            onClick={() => handleStart()}
            className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            //disabled={stepsEngaged}
          >
            Start
          </button>

          <button
            onClick={() => handleStepForward()}
            className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            disabled={!stepsEngaged || allStates.length===0}
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
            onClick={() => resetSession()}
            className="rounded border px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
            //disabled={stepsEngaged}
          >
            Reset
          </button>

          {/* Lab selection dropdown for grading */}
          <select
            value={selectedLabUid}
            onChange={(e) => setSelectedLabUid(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="" disabled>
              {labs.length === 0 ? "Loading labs..." : "Select lab to grade…"}
            </option>
            {labs.map((lab) => (
              <option key={lab.uid} value={lab.uid}>
                {lab.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleGrade()}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            disabled={!selectedLabUid}
          >
            Grade
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
      </div>

      {/* RIGHT PANEL*/}
      <div className="w-full md:basis-[420px] md:flex-none mt-10 md:mt-0">
        <div className="flex flex-row gap-4">
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

    </div>
  </div>
);

};
