"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Project, Workspace } from "@/components/types";
import { readWorkspace, writeWorkspace } from "@/components/workspace-store";
import { defaultProjectState, makeProjectId, makeUid } from "@/components/project-helpers";

export default function StudentNewProjectPage() {
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const parsed = readWorkspace();
    const workspaceUid = parsed?.uid ?? makeUid();
    const existingProjects: Project[] = Array.isArray(parsed?.projects)
      ? (parsed?.projects as Project[])
      : [];

    const newProject: Project = {
      id: makeProjectId(),
      name: `Untitled project ${existingProjects.length + 1}`,
      description: "",
      createdAt: new Date().toISOString(),
      state: { ...defaultProjectState },
    };

    const workspace: Workspace = {
      uid: workspaceUid,
      currentProjectId: newProject.id,
      projects: [...existingProjects, newProject],
    };

    writeWorkspace(workspace);
    router.replace(`/student/projects/${newProject.id}`);
  }, [router]);

  return null;
}
