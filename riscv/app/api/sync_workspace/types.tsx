import { z } from 'zod';

const ProjectStateSchema = z.object({
  code: z.string().optional(),
  resp: z.unknown().nullable().optional(),
  simState: z.unknown().nullable().optional(),
  stepIndex: z.number().optional(),
  allStates: z.array(z.unknown()).optional(),
  registerOverrides: z.record(z.string()).optional(),
});

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  state: ProjectStateSchema,
});

const WorkspaceSchema = z.object({
  uid: z.string(),
  currentProjectId: z.string().nullable().optional(),
  projects: z.array(ProjectSchema),
});

export const SyncWorkspaceRequestSchema = z.object({
  workspace: WorkspaceSchema,
});

export type SyncWorkspaceRequest = z.infer<typeof SyncWorkspaceRequestSchema>;

export const SyncWorkspaceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type SyncWorkspaceResponse = z.infer<typeof SyncWorkspaceResponseSchema>;
