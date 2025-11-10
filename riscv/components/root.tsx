"use client";
import React from "react";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";


//key for the app
const LS_KEY = "riscv-session";

type VersionEntry = {
  id: string;
  code: string;
  createdAt: string;
};

type SavedVersion = {
  uid: string;
  currentVersionId: string | null;
  versions: VersionEntry[];
  resp: AssemblyInfoData | null;
  simState: SimState | null;
  stepIndex: number;
  allStates: SubmitResponse["states"];
};

//BACKEND MUST MATCH THIS
type SubmitRequest = { 
  code: string; 
  registers: Record<string, string>;
  memory: Record<string, string>;
};


//BACKEND MUST MATCH THIS
type SubmitResponse = {
  hadError: boolean;
  errorMessage: string;
  states: Array<{
    registers: Record<string, string>, // register -> value
    memory: Record<string, string>,    // addr -> value
    labelName: string,
  }>;
};

type AssemblyInfoData = {
  hadError: boolean;
  errorMessage: string;
  registers: Record<string, string>;
  memory: Record<string, string>;
}

// State shape returned by /api/sim
type SimState = {
  currentLine: number;
  halted: boolean;
  registers: Record<string, number | string>;
  memory: Record<string, number | string>;
  labelName?: string;
  errorMessage?: string | null;
};

function makeUid() {
  return "uid-" + Math.random().toString(36).slice(2);
}

function makeVersionId() {
  return "v-" + Date.now();
}
export default function Root() {
  const [uid, setUid] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [memory, setMemory] = React.useState("");
  const [resp, setResp] = React.useState<AssemblyInfoData | null>(null);
  const [stepsEngaged, setStepsEngaged] = React.useState(false); 
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [simState, setSimState] = React.useState<SimState | null>(null);
  const [allStates, setAllStates] = React.useState<SubmitResponse["states"]>([]);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [versions, setVersions] = React.useState<VersionEntry[]>([]);
  const [currentVersionId, setCurrentVersionId] = React.useState<string | null>(null);

const [runMeta, setRunMeta] = React.useState<{ hadError: boolean; errorMessage: string }>({
  hadError: false,
  errorMessage: "",
});


  //LOADS LOCAL STORAGE
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed: SavedVersion = JSON.parse(raw);

        // uid
        setUid(parsed.uid ?? makeUid());

        // versions
        const vs = Array.isArray(parsed.versions) ? parsed.versions : [];
        setVersions(vs);

        // if we have a currentVersionId, load that code
        if (parsed.currentVersionId) {
          const found = vs.find((v) => v.id === parsed.currentVersionId);
          if (found) {
            setCode(found.code);
            setCurrentVersionId(found.id);
          } else {
            // fallback: latest in array
            if (vs.length > 0) {
              const latest = vs[0];
              setCode(latest.code);
              setCurrentVersionId(latest.id);
            }
          }
        } else {
          // no currentVersionId, but we do have versions
          if (vs.length > 0) {
            const latest = vs[0];
            setCode(latest.code);
            setCurrentVersionId(latest.id);
          }
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
        setVersions([]);
        setCurrentVersionId(null);
      }
    } else {
      // first time
      const freshUid = makeUid();
      setUid(freshUid);
      setVersions([]);
      setCurrentVersionId(null);
    }
  }, []);

  //HELPER to write everything to local storage
  const persist = React.useCallback(
    (next: Partial<SavedVersion> = {}) => {
      if (typeof window === "undefined") return;

      const payload: SavedVersion = {
        uid,
        currentVersionId,
        versions,
        resp,
        simState,
        stepIndex,
        allStates,
        ...next,
      };

      window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    },
    [uid, currentVersionId, versions, resp, simState, stepIndex, allStates]
  );
  

  //changes site based on any changes to the paramters in []
  React.useEffect(() => {
    if (!uid) return;
    persist();
  }, [uid, currentVersionId, versions, resp, simState, persist]);

  //when code changes in editor we update current version (or create one)
  const handleCodeChange = (nextCode: string) => {

    setCode(nextCode);

    

    setVersions((prev) => {
      // if we have a current version, update that one
      if (currentVersionId) {
        const idx = prev.findIndex((v) => v.id === currentVersionId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            code: nextCode,
            // optional: updatedAt?
          };
          // persist with updated versions + currentVersionId
          persist({ versions: updated, currentVersionId });
          return updated;
        }
      }

      // else make a brand new version and make it current
      const newVersion: VersionEntry = {
        id: makeVersionId(),
        code: nextCode,
        createdAt: new Date().toISOString(),
      };

      const newList = [newVersion, ...prev]; // newest first
      const newId = newVersion.id;
      setCurrentVersionId(newId);
      persist({ versions: newList, currentVersionId: newId });
      return newList;
    });
  };

  //LETS USER CHANGE VERSIONS WHEN PICKING FRMO THE DROP DOWN
  const handleSelectVersion = (versionId: string) => {
    const found = versions.find((v) => v.id === versionId);
    if (!found) return;
    setCurrentVersionId(found.id);
    setCode(found.code);

    // clear so user sees “this version hasn’t been run yet”
    setResp(null);
    setSimState(null);

    persist({
      currentVersionId: found.id,
      resp: null,
      simState: null,
    });
  };


  //RUN AND START HELPER TO POPULATE RESPONSE AND ALL STATES
  const runBackend = async (): Promise<{
  states: SubmitResponse["states"];
  hadError: boolean;
  errorMessage: string;
} | null> => {
  try {
    const reqBody: SubmitRequest = {
      code,
      registers: {}, // TODO: fill from user input later
      memory: {},    // TODO: fill from user input later
    };

    const res = await fetch("/api/run", {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(await res.text());

    const json = (await res.json()) as Partial<SubmitResponse>;

    // 1. Guard: make sure states is a non-empty array
    if (!Array.isArray(json.states) || json.states.length === 0) {
      setAllStates([]);
      setStepIndex(0);

      const assemblyData: AssemblyInfoData = {
        hadError: !!json.hadError,
        errorMessage: json.errorMessage ?? "Backend returned no states",
        registers: {},
        memory: {},
      };

      setRunMeta({
        hadError: assemblyData.hadError,
        errorMessage: assemblyData.errorMessage,
      });
      setResp(assemblyData);

      persist({
        allStates: [],
        stepIndex: 0,
        resp: assemblyData,
      });

      return null;
    }

    // 2. Normal case: we have at least one state
    const states = json.states;

    setAllStates(states);
    setStepIndex(0);
    setRunMeta({
      hadError: !!json.hadError,
      errorMessage: json.errorMessage ?? "",
    });

    // persist step-related stuff
    persist({
      allStates: states,
      stepIndex: 0,
    });

    return {
      states,
      hadError: !!json.hadError,
      errorMessage: json.errorMessage ?? "",
    };
  } catch (e: any) {
    setFatalError(e?.message ?? "Run failed");
    return null;
  }
};

  //HANDLE RUN AND CALL API RUN
  const handleRun = async () => {
  const result = await runBackend();
  if (!result) return;

  const { states, hadError, errorMessage } = result;

  // show the final state (same as before)
  const finalState = states[states.length - 1]!;

  const assemblyData: AssemblyInfoData = {
    hadError,
    errorMessage,
    registers: finalState.registers,
    memory: finalState.memory,
  };

  setResp(assemblyData);
  setStepsEngaged(false);

  // persist current view (states + stepIndex already persisted in runBackend)
  persist({
    resp: assemblyData,
  });
};



  function resetSession() {
    setAllStates([]);
    setStepIndex(0);
    setResp(null);
    persist({
      allStates: [],
      stepIndex: 0,
      resp: null,
    });
  }

  function handleStepForward() {
  setStepIndex((idx) => {
    const next = Math.min(idx + 1, allStates.length - 1);
    const nextState = allStates[next];
    if (nextState) {
      const newResp = {
        hadError: runMeta.hadError,
        errorMessage: runMeta.errorMessage,
        registers: nextState.registers,
        memory: nextState.memory,
      };
      setResp(newResp);
      persist({ resp: newResp });
      // also update simState / highlighting if needed
    }
    return next;
  });
  }

  function handleStepBack() {
  setStepIndex((idx) => {
    const prev = Math.max(idx - 1, 0);
    const prevState = allStates[prev];
    if (prevState) {
      const newResp = {
        hadError: runMeta.hadError,
        errorMessage: runMeta.errorMessage,
        registers: prevState.registers,
        memory: prevState.memory,
      };
      setResp(newResp);
      persist({ resp: newResp });
      // also update simState / highlighting if needed
    }
    return prev;
  });
  }

  async function handleStart() {
    let statesToUse = allStates;
    let hadError = runMeta.hadError;
    let errorMessage = runMeta.errorMessage;

    // If we don't have states yet, call backend now
    if (statesToUse.length === 0) {
      const result = await runBackend();
      if (!result) return; // error or no states already handled inside runBackend

      statesToUse = result.states;
      hadError = result.hadError;
      errorMessage = result.errorMessage;
    }

    if (statesToUse.length === 0) return; // extra guard

    const firstState = statesToUse[0];

    const newResp: AssemblyInfoData = {
      hadError,
      errorMessage,
      registers: firstState.registers,
      memory: firstState.memory,
    };

    setStepIndex(0);
    setResp(newResp);
    setStepsEngaged(true);

    persist({ resp: newResp, stepIndex: 0 });
  }


return (
  <div className="relative">
    <div className="flex flex-col md:flex-row md:flex-wrap gap-30 px-4 mt-4">
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

          {/* versions dropdown (kept from Version 1) */}
          <select
            value={currentVersionId ?? ""}
            onChange={(e) => handleSelectVersion(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="" disabled>
              {versions.length === 0 ? "No versions yet" : "Select version…"}
            </option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} — {new Date(v.createdAt).toLocaleString()}
              </option>
            ))}
          </select>

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

      {/* RIGHT PANEL (like Version 2, but with your prop name) */}
      <div className="w-full md:basis-[420px] md:flex-none mt-10 md:mt-0">
        <AssemblyInfo response={resp} />
      </div>

    </div>
  </div>
);

};