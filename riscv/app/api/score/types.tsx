import { z } from 'zod';

// Schema for the score request
export const ScoreRequestSchema = z.object({
  code: z.string(),
  test_uid: z.string(),
});

export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;

// Schema for the score response
export const ScoreResponseSchema = z.object({
  pass: z.boolean(),
  error: z.string().optional(),
});

export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;
