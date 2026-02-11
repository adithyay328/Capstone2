import { z } from 'zod';

const LabSessionSchema = z.object({
  storageKey: z.string(),
  uid: z.string(),
  labUid: z.string().nullable(),
  version: z.number(),
  code: z.string(),
  resp: z.unknown().nullable(),
  simState: z.unknown().nullable(),
  stepIndex: z.number(),
  allStates: z.array(z.unknown()),
  registerOverrides: z.record(z.string()),
});

export const LoadLabSessionResponseSchema = z.object({
  success: z.boolean(),
  session: LabSessionSchema.nullable().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type LoadLabSessionResponse = z.infer<typeof LoadLabSessionResponseSchema>;
