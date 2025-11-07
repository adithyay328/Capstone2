import * as z from "zod";

// Request schema - contains the lab ID
export const GetLabRequestSchema = z.object({
  id: z.string().min(1, "Lab ID is required")
});

// Response schema - contains lab details
export const GetLabResponseSchema = z.object({
  id: z.string(),
  title: z.string()
});

// TypeScript types
export type GetLabRequest = z.infer<typeof GetLabRequestSchema>;
export type GetLabResponse = z.infer<typeof GetLabResponseSchema>;
