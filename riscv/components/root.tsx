"use client";
import React from "react";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";
import Sidebar from "./sidebar"

//key for the app
const LS_KEY = "riscv-session";

type VersionEntry = {
  id: string;
  code: string;
  createdAt: string;
};

type ProjectState = {
  currentVersionId: string | null;
  versions: VersionEntry[];
  resp: AssemblyInfoData | null;
  simState: SimState | null;
  stepIndex: number;
  allStates: SubmitResponse["states"];
};

/**
 * A single project (like one Google Doc)
 */
type Project = {
  id: string;         // "p-..." unique per project
  name: string;       // "Untitled project 1", etc.
  description?: string;
  createdAt: string;  // ISO timestamp
  state: ProjectState;
};

/**
 * Workspace = everything saved for a user in localStorage
 */
type Workspace = {
  uid: string;
  currentProjectId: string | null;
  projects: Project[];
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

const defaultProjectState: ProjectState = {
  currentVersionId: null,
  versions: [],
  resp: null,
  simState: null,
  stepIndex: 0,
  allStates: [],
};

function makeUid() {
  return "uid-" + Math.random().toString(36).slice(2);
}

function makeProjectId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return "p-" + crypto.randomUUID();
  }
  return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function makeVersionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return "v-" + crypto.randomUUID();
  }
  return "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}


type ProjectsGridProps = {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
};

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  onOpenProject,
  onNewProject,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Projects</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewProject}
            className="rounded bg-[rgb(248,196,119)] px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + New Project
          </button>
        </div>
      </div>


      {projects.length === 0 ? (
        <div className="mt-12 text-center text-sm text-zinc-400">
          You don&apos;t have any projects yet.
          <br />
          Click <span className="font-semibold">New Project</span> to start.
        </div>
      ) : (
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {projects.map((project) => {
      return (
        <div
          key={project.id}
        >
          {/* Name*/}
          <input
            type="text"
            defaultValue={project.name}
            readOnly={true}
            className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950/60 px-2 py-1 text-sm text-zinc-100"
            placeholder="Project name"
          />

          {/* Description */}
          <textarea
            defaultValue={project.description ?? ""}
            readOnly={true}
            className="mb-3 w-full rounded border border-zinc-700 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-100 resize-none h-16"
            placeholder="Write about your awesome project"
          />

          <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              Created{" "}
              {new Date(project.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <button
              type="button"
              defaultValue={"Open"}
              onClick={() => onOpenProject(project.id)}
              className="ml-2 rounded bg-[rgb(248,196,119)] px-3 py-1 text-[11px] font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-40"
            >
              Open
            </button>
          </div>
        </div>
      );
    })}
  </div>
)}
    </div>
  );
};

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
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"editor" | "projects">("editor");
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [selectedForDelete, setSelectedForDelete] = React.useState<string[]>([]);

  const currentProject = React.useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const [runMeta, setRunMeta] = React.useState<{ hadError: boolean; errorMessage: string }>({
    hadError: false,
    errorMessage: "",
  });

const persist = React.useCallback(
  (next?: Partial<ProjectState>) => {
    if (typeof window === "undefined") return;
    if (!uid || !currentProjectId) return;

    setProjects((prev) => {
      if (prev.length === 0) return prev;

      const idx = prev.findIndex((p) => p.id === currentProjectId);
      if (idx === -1) return prev;

      const project = prev[idx];

      const mergedState: ProjectState = {
        ...defaultProjectState,
        ...(project.state ?? {}),
        currentVersionId,
        versions,
        resp,
        simState,
        stepIndex,
        allStates,
        ...next,
      };

      const updatedProject: Project = {
        ...project,
        state: mergedState,
      };

      const updatedProjects = [...prev];
      updatedProjects[idx] = updatedProject;

      const workspace: Workspace = {
        uid,
        currentProjectId,
        projects: updatedProjects,
      };

      window.localStorage.setItem(LS_KEY, JSON.stringify(workspace));
      return updatedProjects;
    });
  },
  [uid, currentProjectId, currentVersionId, versions, resp, simState, stepIndex, allStates]
);

    const loadProjectIntoState = React.useCallback((project: Project | null) => {
      if (!project) {
        // blank editor
        setVersions([]);
        setCurrentVersionId(null);
        setCode("");
        setResp(null);
        setSimState(null);
        setAllStates([]);
        setStepIndex(0);
        setStepsEngaged(false);
        setFatalError(null);
        return;
      }

      const state = project.state ?? defaultProjectState;
      const vs = Array.isArray(state.versions) ? state.versions : [];

      let nextVersionId = state.currentVersionId;
      if (!nextVersionId || !vs.some((v) => v.id === nextVersionId)) {
        nextVersionId = vs[0]?.id ?? null;
      }

      setVersions(vs);
      setCurrentVersionId(nextVersionId);

      const activeVersion =
        vs.find((v) => v.id === nextVersionId) ?? vs[0] ?? null;

      setCode(activeVersion?.code ?? "");
      setResp(state.resp ?? null);
      setSimState(state.simState ?? null);
      setAllStates(Array.isArray(state.allStates) ? state.allStates : []);
      setStepIndex(typeof state.stepIndex === "number" ? state.stepIndex : 0);
      setStepsEngaged(false);
      setFatalError(null);
    }, []);


React.useEffect(() => {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(LS_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<Workspace>;

        const workspaceUid = parsed.uid ?? makeUid();
        setUid(workspaceUid);

        let existingProjects: Project[] = Array.isArray(parsed.projects)
          ? (parsed.projects as Project[])
          : [];
        // ensure description exists on old data
        existingProjects = existingProjects.map((p) => ({
          description: p.description ?? "",
          ...p,
        }));

        // If somehow there are no projects, create one.
        if (existingProjects.length === 0) {
          const firstProject: Project = {
            id: makeProjectId(),
            name: "Untitled project 1",
            description: "",
            createdAt: new Date().toISOString(),
            state: { ...defaultProjectState },
          };
          existingProjects = [firstProject];

          const newWorkspace: Workspace = {
            uid: workspaceUid,
            currentProjectId: firstProject.id,
            projects: existingProjects,
          };
          window.localStorage.setItem(LS_KEY, JSON.stringify(newWorkspace));
        }

        setProjects(existingProjects);

        let projId = parsed.currentProjectId;
        if (!projId || !existingProjects.some((p) => p.id === projId)) {
          projId = existingProjects[0].id;
        }
        setCurrentProjectId(projId);

        const currentProject =
          existingProjects.find((p) => p.id === projId) ?? existingProjects[0];

        loadProjectIntoState(currentProject);
        return;
      } catch (e) {
        console.warn("bad workspace, resetting", e);
        // fall through to fresh workspace
      }
    }

    const freshUid = makeUid();
    const firstProject: Project = {
      id: makeProjectId(),
      name: "Untitled project 1",
      createdAt: new Date().toISOString(),
      state: { ...defaultProjectState },
    };

    setUid(freshUid);
    setProjects([firstProject]);
    setCurrentProjectId(firstProject.id);

    // Editor state for the empty project
    setVersions([]);
    setCurrentVersionId(null);
    setCode("");
    setResp(null);
    setSimState(null);
    setAllStates([]);
    setStepIndex(0);
    setStepsEngaged(false);
    setFatalError(null);

    const workspace: Workspace = {
      uid: freshUid,
      currentProjectId: firstProject.id,
      projects: [firstProject],
    };
    window.localStorage.setItem(LS_KEY, JSON.stringify(workspace));
  }, [loadProjectIntoState]);


    //changes site based on any changes to the paramters in []
  React.useEffect(() => {
    if (!uid) return;
    persist();
  }, [uid, currentVersionId, versions, resp, simState, persist]);

  function handleNewProject() {
    let workspaceUid = uid;
    if (!workspaceUid) {
      workspaceUid = makeUid();
      setUid(workspaceUid);
    }

    const newProject: Project = {
      id: makeProjectId(),
      name: `Untitled project ${projects.length + 1}`,
      description: "",
      createdAt: new Date().toISOString(),
      state: { ...defaultProjectState },
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setCurrentProjectId(newProject.id);
    loadProjectIntoState(newProject);
    setView("editor");

    // Clear editor / state for the new project
    setVersions([]);
    setCurrentVersionId(null);
    setCode("");
    setResp(null);
    setSimState(null);
    setAllStates([]);
    setStepIndex(0);
    setStepsEngaged(false);
    setFatalError(null);

    if (typeof window !== "undefined" && workspaceUid) {
      const workspace: Workspace = {
        uid: workspaceUid,
        currentProjectId: newProject.id,
        projects: updatedProjects,
      };
      window.localStorage.setItem(LS_KEY, JSON.stringify(workspace));
    }
  }


function handleSelectProject(projectId: string) {
  if (projectId === currentProjectId) {
    setView("editor");
    return;
  }
  
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  setCurrentProjectId(projectId);
  loadProjectIntoState(project);
  setView("editor");

  if (typeof window !== "undefined" && uid) {
    const workspace: Workspace = {
      uid,
      currentProjectId: projectId,
      projects,
    };
    window.localStorage.setItem(LS_KEY, JSON.stringify(workspace));
  }
}

const handleSaveVersion = () => {
  // no project selected? nothing to do
  if (!currentProjectId) return;

  const newVersion: VersionEntry = {
    id: makeVersionId(),
    code, // current editor contents
    createdAt: new Date().toISOString(),
  };

  const newList = [newVersion, ...versions]; // newest first
  const newId = newVersion.id;

  setVersions(newList);
  setCurrentVersionId(newId);

  // persist this new version into the current project
  persist({
    versions: newList,
    currentVersionId: newId,
  });
};


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
  };



return (
  <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
    {/* LEFT SIDEBAR */}
    <Sidebar
      initialOpen={false}
      onNewProject={handleNewProject}
      onOpenProjects={() => setView("projects")}
    />

    {/* MAIN AREA */}
    <main className="flex-1 relative">
      {view === "projects" ? (
       
        <div className="px-4 mt-4 md:px-6">
          <ProjectsGrid
            projects={projects}
            onOpenProject={handleSelectProject}
            onNewProject={handleNewProject}
          />
        </div>
      ) : (

    <div className="relative">
      <div className="flex flex-col md:flex-row md:flex-wrap gap-30 px-4 mt-4">

        {/* Editor + controls column */}
        <div className="w-full md:w-[65vw] lg:w-[70vw] xl:w-[75vw] mt-5 mb-[-10]">
          <div className="mb-2">
            <div className="text-xs font-semibold text-zinc-200">
              {currentProject?.name || "Untitled project"}
            </div>
            {currentProject?.description && (
              <div className="text-[11px] text-zinc-400 truncate">
                {currentProject.description}
              </div>
            )}
          </div>

          {/* EDITOR */}
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            
          />

          {/* CONTROLS under editor */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* keep all 5 of your buttons */}
            <button
              onClick={handleRun}
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900 disabled:opacity-50"
              
            >
              Run
            </button>

            <button
              onClick={() => handleStart()}
              className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              
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
              
            >
              Reset
            </button>

            {/* versions dropdown (kept from Version 1) */}
            {/* PROJECT + VERSION CONTROLS */}
            <div className="flex flex-wrap gap-3 items-center ml-auto">


              {/* Versions within the current project */}
              <select
                value={currentVersionId ?? ""}
                onChange={(e) => handleSelectVersion(e.target.value)}
                className="rounded border px-2 py-1 text-sm"
                disabled={versions.length === 0}
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
              <button
                type="button"
                onClick={handleSaveVersion}
                className="rounded bg-[rgb(248,196,119)] px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Save
              </button>

              {/* uid (still useful for debugging) */}
              <span className="text-xs text-zinc-500">
                {uid}
              </span>
            </div>
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
)}
</main>
</div>
);
}