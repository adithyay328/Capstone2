import { z } from 'zod';

const LabSessionSchema = z.object({
  storageKey: z.string(),
  uid: z.string(),
  labUid: z.string().nullable().optional(),
  version: z.number().optional(),
  code: z.string(),
  resp: z.unknown().nullable(),
  simState: z.unknown().nullable(),
  stepIndex: z.number(),
  allStates: z.array(z.unknown()),
  registerOverrides: z.record(z.string()),
});

export const SyncLabSessionRequestSchema = z.object({
  session: LabSessionSchema,
});

export type SyncLabSessionRequest = z.infer<typeof SyncLabSessionRequestSchema>;

export const SyncLabSessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type SyncLabSessionResponse = z.infer<typeof SyncLabSessionResponseSchema>;
