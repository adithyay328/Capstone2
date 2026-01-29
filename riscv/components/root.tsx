"use client";
import React from "react";
import AssemblyInfo from "./assembly-info";
import Sidebar from "./sidebar";
import ProjectsGrid from "./projects-grid";
import EditorPanel from "./editor-panel";
import EditorControls from "./editor-controls";
import useRunner from "./use-runner";
import { readWorkspace, writeWorkspace } from "./workspace-store";
import { defaultProjectState, makeProjectId, makeUid } from "./project-helpers";
import RegisterVisualPanel from "@/components/RegisterVisualPanel"; //seven-segment display
import RegisterEditor from "./register-editor";

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
  uid: string;
  stepsEngaged: boolean;
  stepIndex: number;
  allStatesLength: number;
  fatalError: string | null;
  resp: AssemblyInfoData | null;
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
  uid,
  stepsEngaged,
  stepIndex,
  allStatesLength,
  fatalError,
  resp,
}) => (
  <div className="relative">
    <div className="flex flex-col md:flex-row md:flex-wrap gap-5 px-4">
      {/* Editor + controls column */}
      <div className="w-full md:w-[65vw] lg:w-[70vw] xl:w-[75vw] mt-5">
        <EditorPanel
          projectName={projectName}
          projectDescription={projectDescription}
          code={code}
          onCodeChange={onCodeChange}
        />

        <EditorControls
          onRun={onRun}
          onStart={onStart}
          onStop={onStop}
          onStepForward={onStepForward}
          onStepBack={onStepBack}
          onReset={onReset}
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
      </div>

      {/* RIGHT PANEL */}
      <div className="flex gap-10 w-full md:basis-[420px] md:flex-none">
        <AssemblyInfo response={resp} />

        {/* Seven-segment + LEDs */}
        <div>
          <RegisterVisualPanel
            registers={resp?.registers ?? null}
            track="x1"
            digits={4}
          />
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
          : {}
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
        return updatedProjects;
      });
    },
    [currentProjectId, uid]
  );


React.useEffect(() => {
  if (typeof window === "undefined") return;

  const parsed = readWorkspace();

    if (parsed) {
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
      return;
    }

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
  }, [loadProjectIntoState]);


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

  return (
    <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
      {/* LEFT SIDEBAR */}
      <Sidebar
        initialOpen={false}
        onNewProject={handleNewProject}
        onOpenProjects={() => setView("projects")}
      />

      {/* MAIN AREA */}
      <main className="flex-1 relative pl-16">
        {view === "projects" ? (
          <ProjectsView
            projects={projects}
            onOpenProject={handleSelectProject}
            onDeleteProject={deleteProjectById}
            onUpdateProject={updateProjectById}
          />
        ) : (
          <>
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
            uid={uid}
            stepsEngaged={stepsEngaged}
            stepIndex={stepIndex}
            allStatesLength={allStates.length}
            fatalError={fatalError}
            resp={resp}
          />
          <div className="ml-5 mt-5 border-t pt-4 max-w-md">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide">
              Register Presets
            </h2>
            <RegisterEditor
            //sets registers to defaultRegisters
            //OR set them to whatever user has overridden in uiRegisters
              registers={uiRegisters}
              disabled={stepsEngaged}
              onChange={(key, value) => //equal to setRegisterOverrides
                setRegisterOverrides((prev) => {
                  //we copy previous registerOverrides into "next" and modify next, so we dont mess up original prev state
                  const next = { ...prev };
                  if (!value.trim()) {
                    // if reg is empty or user clears out the value, we dont want to send empty register
                    //we delete that key from registerOverrides
                    delete next[key];
                    console.log("Debugging, reached if");
                  } 
                  else  // add the new value to registerOverrides
                  {
                    console.log("Debugging else");
                    next[key] = value;
                  }
                  return next; //return updated registerOverrides to setRegisterOverrides
                })
              }
            />
          </div>
          </>
        )}
      </main>
    </div>
  );
}
