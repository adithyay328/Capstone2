"use client";
import React from "react";
import AssemblyInfo from "./assembly-info";
import Sidebar from "./sidebar";
import ProjectsGrid from "./projects-grid";
import EditorPanel from "./editor-panel";
import EditorControls from "./editor-controls";
import useRunner from "./use-runner";
import { writeWorkspace } from "./workspace-store";
import { defaultProjectState, makeProjectId, makeUid } from "./project-helpers";
import RegisterVisualPanel from "@/components/RegisterVisualPanel"; //seven-segment display
import RegisterEditor from "./register-editor";
import { useState } from "react";
import HelpModal from "@/components/help-modal";
import { syncWorkspace } from "@/app/api/sync_workspace/frontend";
import { loadWorkspace } from "@/app/api/load_workspace/frontend";

import type {
  ProjectState,
  Project,
  Workspace,
  SubmitResponse,
  AssemblyInfoData,
  SimState,
} from "./types";

type ProjectsViewProps = {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, next: { name?: string; description?: string }) => void;
};

const InstructionsPanel: React.FC = () => {
  const [open, setOpen] = useState(true);

  if (!open) return null; // fully hidden when closed

  return (
    <div className="relative mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
      {/* Close button */}
      <button
        onClick={() => setOpen(false)}
        className="absolute top-2 right-2 text-yellow-800 font-bold hover:text-yellow-900"
        aria-label="Close instructions"
      >
        ✕
      </button>

      <h3 className="font-semibold text-yellow-800 mb-2">Instructions for Use</h3>
      <ul className="list-disc ml-5 text-sm text-yellow-900">
        <li>The simulation automatically terminates at the <strong>end of the file</strong>.</li>
        <li>Register inputs are <strong>for testing only</strong> and do <strong>not affect your grade</strong>.</li>
      </ul>
    </div>
  );
};
const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onUpdateProject,
}) => (
  <div className="px-4 mt-4 md:px-6">
    <ProjectsGrid
      projects={projects}
      onOpenProject={onOpenProject}
      onDeleteProject={onDeleteProject}
      onUpdateProject={onUpdateProject}
    />
  </div>
);

type EditorViewProps = {
  projectName: string;
  projectDescription?: string;
  code: string;
  onCodeChange: (nextCode: string) => void;
  onRun: () => void;
  onStart: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSyncNow?: () => void;
  uid: string;
  stepsEngaged: boolean;
  stepIndex: number;
  allStatesLength: number;
  fatalError: string | null;
  resp: AssemblyInfoData | null;
  registerPanel: React.ReactNode;
};

const EditorView: React.FC<EditorViewProps> = ({
  projectName,
  projectDescription,
  code,
  onCodeChange,
  onRun,
  onStart,
  onStop,
  onStepForward,
  onStepBack,
  onReset,
  onSyncNow,
  uid,
  stepsEngaged,
  stepIndex,
  allStatesLength,
  fatalError,
  resp,
  registerPanel,
}) => (
  <div className="relative">
    <div className="pt-4 w-full max-w-[90rem] mx-auto">
      <div className="mb-3 w-full max-w-[46.875rem] sm:min-w-[26.875rem] min-w-0">
        <div className="text-xs font-semibold text-zinc-200">{projectName}</div>
        {projectDescription && (
          <div className="text-[11px] text-zinc-400 truncate">
            {projectDescription}
          </div>
        )}
        {/* Instructions for students */}
        <InstructionsPanel />
      </div>
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Editor + controls column */}
        <div className="w-full max-w-[46.875rem] sm:min-w-[26.875rem] min-w-0 flex flex-col">
          <EditorPanel
            projectName={projectName}
            projectDescription={projectDescription}
            code={code}
            onCodeChange={onCodeChange}
            showHeader={false}
          />

        <EditorControls
          onRun={onRun}
          onStart={onStart}
          onStop={onStop}
          onStepForward={onStepForward}
          onStepBack={onStepBack}
          onReset={onReset}
          onSyncNow={onSyncNow}
          uid={uid}
          stepsEngaged={stepsEngaged}
          stepIndex={stepIndex}
          allStatesLength={allStatesLength}
        />

        {/* fatal error box */}
        {fatalError && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {fatalError}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <AssemblyInfo response={resp} />

          {/* Seven-segment + LEDs */}
          <div className="flex-shrink-0">
            <RegisterVisualPanel
              registers={resp?.registers ?? null}
              track="x1"
              digits={4}
            />
          </div>
        </div>
      </div>

        <div className="w-full xl:w-[28rem] min-w-0 mt-5 xl:mt-0">
          {registerPanel}
        </div>
      </div>
    </div>
  </div>
);

export default function Root({
  initialView,
  initialProjectId,
}: {
  initialView?: "editor" | "projects";
  initialProjectId?: string;
}) {
  //starts empty-- Later when a register is changed we will populate this
  const [registerOverrides, setRegisterOverrides] = React.useState<Record<string, string>>({});
  const [uid, setUid] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [memory, setMemory] = React.useState("");
  const [resp, setResp] = React.useState<AssemblyInfoData | null>(null);
  const [stepsEngaged, setStepsEngaged] = React.useState(false); 
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [simState, setSimState] = React.useState<SimState | null>(null);
  const [allStates, setAllStates] = React.useState<SubmitResponse["states"]>([]);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [initStatus, setInitStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [initError, setInitError] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"editor" | "projects">(
    initialView ?? "editor"
  );
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [selectedForDelete, setSelectedForDelete] = React.useState<string[]>([]);

  // we make an object to store defualt 0x0 values for all 32 registers
  //this is what we load into uiRegisters when start up the app 
  // and want to showcase 
    // all registers at 0x0 
  const defaultRegisters = React.useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: 32 }, (_, i) => [`x${i}`, "0x0"])
      ),
    []
  );

  // this is what the UI actually shows--purely UI-- NOT WHAT WE SEND TO BACKEND
  // we layer user overrides on top of defaultRegisters
  // useMemo only re-renders (recreates this UI) if something changes
  const uiRegisters = React.useMemo(
    () => ({
      ...defaultRegisters,      // base values
      ...registerOverrides,     // any user overrides are shown instead
    }),
    [defaultRegisters, registerOverrides]
  );
  
  const currentProject = React.useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const [runMeta, setRunMeta] = React.useState<{ hadError: boolean; errorMessage: string }>({
    hadError: false,
    errorMessage: "",
  });

  const workspaceDirtyRef = React.useRef(false);

  const buildWorkspacePayload = React.useCallback((): Workspace | null => {
    if (!uid) return null;
    return {
      uid,
      currentProjectId,
      projects,
    };
  }, [uid, currentProjectId, projects]);

  const syncWorkspaceNow = React.useCallback(
    async (useBeacon = false, force = false) => {
      if (!workspaceDirtyRef.current && !force) return;
      const payload = buildWorkspacePayload();
      if (!payload) return;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const ok = navigator.sendBeacon(
          "/api/sync_workspace",
          JSON.stringify({ workspace: payload })
        );
        if (ok) {
          workspaceDirtyRef.current = false;
        }
        return;
      }

      const result = await syncWorkspace(payload);
      if (result.success) {
        workspaceDirtyRef.current = false;
      }
    },
    [buildWorkspacePayload]
  );

  React.useEffect(() => {
    return () => {
      void syncWorkspaceNow(true, true);
    };
  }, [syncWorkspaceNow]);

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
        code,
        resp,
        simState,
        stepIndex,
        allStates,
        registerOverrides,
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

      writeWorkspace(workspace);
      return updatedProjects;
    });
  },
  [uid, currentProjectId, code, resp, simState, stepIndex, allStates, registerOverrides]
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
    persist,
    setAllStates,
    setStepIndex,
    setResp,
    setRunMeta,
    setFatalError,
    setStepsEngaged,
  });

    const loadProjectIntoState = React.useCallback((project: Project | null) => {
      if (!project) {
        // blank editor
        setCode("");
        setResp(null);
        setSimState(null);
        setAllStates([]);
        setStepIndex(0);
        setStepsEngaged(false);
        setFatalError(null);
        setRegisterOverrides({});
        return;
      }

      const state = project.state ?? defaultProjectState;
      setCode(state.code ?? "");
      setResp(state.resp ?? null);
      setSimState(state.simState ?? null);
      setAllStates(Array.isArray(state.allStates) ? state.allStates : []);
      setStepIndex(typeof state.stepIndex === "number" ? state.stepIndex : 0);
      setStepsEngaged(false);
      setFatalError(null);
      setRegisterOverrides(
        state.registerOverrides && typeof state.registerOverrides === "object"
          ? state.registerOverrides
          : ({} as Record<string, string>)
      );
    }, []);

  React.useEffect(() => {
    if (!initialProjectId) return;
    const target = projects.find((p) => p.id === initialProjectId);
    if (!target) return;
    if (currentProjectId !== initialProjectId) {
      setCurrentProjectId(initialProjectId);
      loadProjectIntoState(target);
    }
    setView("editor");
  }, [currentProjectId, initialProjectId, loadProjectIntoState, projects]);

  const deleteProjectById = React.useCallback(
    (projectId: string) => {
      if (typeof window === "undefined") return;

      setProjects((prev) => {
        const nextProjects = prev.filter((p) => p.id !== projectId);
        if (nextProjects.length === prev.length) return prev;

        let nextCurrentId = currentProjectId;
        let nextProject: Project | null = null;

        if (currentProjectId === projectId) {
          nextProject = nextProjects[0] ?? null;
          nextCurrentId = nextProject?.id ?? null;
          setCurrentProjectId(nextCurrentId);
          loadProjectIntoState(nextProject);
        }

        const workspaceUid = uid || makeUid();
        if (!uid) {
          setUid(workspaceUid);
        }

        const workspace: Workspace = {
          uid: workspaceUid,
          currentProjectId: nextCurrentId ?? null,
          projects: nextProjects,
        };
        writeWorkspace(workspace);
        void syncWorkspace(workspace);
        return nextProjects;
      });
    },
    [currentProjectId, loadProjectIntoState, uid]
  );

  const updateProjectById = React.useCallback(
    (projectId: string, next: { name?: string; description?: string }) => {
      if (typeof window === "undefined") return;

      setProjects((prev) => {
        let didUpdate = false;
        const updatedProjects = prev.map((project) => {
          if (project.id !== projectId) return project;
          didUpdate = true;
          return { ...project, ...next };
        });

        if (!didUpdate) return prev;

        const workspaceUid = uid || makeUid();
        if (!uid) {
          setUid(workspaceUid);
        }

        const workspace: Workspace = {
          uid: workspaceUid,
          currentProjectId,
          projects: updatedProjects,
        };
        writeWorkspace(workspace);
        void syncWorkspace(workspace);
        return updatedProjects;
      });
    },
    [currentProjectId, uid]
  );


React.useEffect(() => {
  if (typeof window === "undefined") return;
  let cancelled = false;

  const applyWorkspace = (parsed: Partial<Workspace>) => {
    if (cancelled) return;
    const workspaceUid = parsed.uid ?? makeUid();
    setUid(workspaceUid);

    let existingProjects: Project[] = Array.isArray(parsed.projects)
      ? (parsed.projects as Project[])
      : [];
    // ensure description exists on old data
    existingProjects = existingProjects.map((p) => {
      const state = (p.state ?? {}) as Partial<ProjectState> & {
        versions?: Array<{ id?: string; code?: string }>;
        currentVersionId?: string | null;
      };
      let codeValue = typeof state.code === "string" ? state.code : "";
      if (!codeValue && Array.isArray(state.versions)) {
        const match =
          state.versions.find((v) => v?.id === state.currentVersionId) ??
          state.versions[0];
        if (match?.code) {
          codeValue = match.code;
        }
      }
      return {
        description: p.description ?? "",
        ...p,
        state: {
          ...defaultProjectState,
          ...state,
          code: codeValue,
        },
      };
    });

    // If somehow there are no projects, create one.
    if (existingProjects.length === 0) {
      const firstProject: Project = {
        id: makeProjectId(),
        name: "Untitled project 1",
        description: "",
        createdAt: new Date().toISOString(),
        state: { ...defaultProjectState, code: "" },
      };
      existingProjects = [firstProject];

      const newWorkspace: Workspace = {
        uid: workspaceUid,
        currentProjectId: firstProject.id,
        projects: existingProjects,
      };
      writeWorkspace(newWorkspace);
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
  };

  const applyFreshWorkspace = (): Workspace => {
    const freshUid = makeUid();
    const firstProject: Project = {
      id: makeProjectId(),
      name: "Untitled project 1",
      createdAt: new Date().toISOString(),
      state: { ...defaultProjectState, code: "" },
    };

    setUid(freshUid);
    setProjects([firstProject]);
    setCurrentProjectId(firstProject.id);

    // Editor state for the empty project
    setCode("");
    setResp(null);
    setSimState(null);
    setAllStates([]);
    setStepIndex(0);
    setStepsEngaged(false);
    setFatalError(null);
    setRegisterOverrides({});
    setRegisterOverrides({});

    const workspace: Workspace = {
      uid: freshUid,
      currentProjectId: firstProject.id,
      projects: [firstProject],
    };
    writeWorkspace(workspace);
    return workspace;
  };

  const hydrate = async () => {
    setInitStatus("loading");
    setInitError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setInitStatus("error");
      setInitError("Initial connection required. Check your internet connection and reload.");
      return;
    }

    const remote = await loadWorkspace();
    if (cancelled) return;

    if (!remote.success) {
      setInitStatus("error");
      setInitError(remote.message ?? "Unable to connect to the database.");
      return;
    }

    if (remote.workspace) {
      const workspaceFromRemote = remote.workspace as Workspace;
      writeWorkspace(workspaceFromRemote);
      applyWorkspace(workspaceFromRemote);
      setInitStatus("ready");
      return;
    }

    const fresh = applyFreshWorkspace();
    await syncWorkspace(fresh);
    setInitStatus("ready");
  };

  void hydrate();

  return () => {
    cancelled = true;
  };
}, [loadProjectIntoState]);

  React.useEffect(() => {
    if (!uid) return;
    workspaceDirtyRef.current = true;
  }, [uid, currentProjectId, projects, code, resp, simState, stepIndex, allStates, registerOverrides]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => {
      void syncWorkspaceNow();
    }, 3 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [syncWorkspaceNow]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePageHide = () => {
      void syncWorkspaceNow(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void syncWorkspaceNow(true);
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncWorkspaceNow]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      void syncWorkspaceNow();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [syncWorkspaceNow]);


    //changes site based on any changes to the paramters in []
  React.useEffect(() => {
    if (!uid) return;
    persist();
  }, [uid, code, resp, simState, persist]);

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
      state: { ...defaultProjectState, code: "" },
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setCurrentProjectId(newProject.id);
    loadProjectIntoState(newProject);
    setView("editor");

    // Clear editor / state for the new project
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
      writeWorkspace(workspace);
      void syncWorkspace(workspace);
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
    writeWorkspace(workspace);
    void syncWorkspace(workspace);
  }
}

  //when code changes in editor we update current version (or create one)
  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    persist({ code: nextCode });
  };

  const handleReset = React.useCallback(() => {
    setRegisterOverrides({});
    resetSession({ registerOverrides: {} });
  }, [resetSession]);

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

  const handleOpenProjects = () => {
    void syncWorkspaceNow(false, true);
    setView("projects");
  };

  return (
    <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
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

      {/* MAIN AREA */}
      <main className="flex-1 relative px-4 sm:px-6 md:pl-23">
        {view === "projects" ? (
          <ProjectsView
            projects={projects}
            onOpenProject={handleSelectProject}
            onDeleteProject={deleteProjectById}
            onUpdateProject={updateProjectById}
          />
        ) : (
          <>
          <div className="ml-10">
          <EditorView
            projectName={currentProject?.name || "Untitled project"}
            projectDescription={currentProject?.description}
            code={code}
            onCodeChange={handleCodeChange}
            onRun={handleRun}
            onStart={handleStart}
            onStop={handleStop}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSyncNow={() => void syncWorkspaceNow(false, true)}
            uid={uid}
            stepsEngaged={stepsEngaged}
            stepIndex={stepIndex}
            allStatesLength={allStates.length}
            fatalError={fatalError}
            resp={resp}
            registerPanel={
              <div className="rounded-md border border-zinc-700 bg-zinc-900/40 h-[46rem] p-4 flex flex-col">
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
                          console.log("Debugging, reached if");
                        } else {
                          console.log("Debugging else");
                          next[key] = value;
                        }
                        return next;
                      })
                    }
                  />
                </div>
              </div>
            }
          />
          </div>
          </>
        )}
      </main>
    </div>
  );
}
