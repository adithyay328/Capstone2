"use client";
import type { Workspace } from "./types";

const WORKSPACE_STORAGE_KEY = "riscv-session";

export const readWorkspace = (): Partial<Workspace> | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Partial<Workspace>;
  } catch (e) {
    console.warn("bad workspace, resetting", e);
    return null;
  }
};

export const writeWorkspace = (workspace: Workspace) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
};
