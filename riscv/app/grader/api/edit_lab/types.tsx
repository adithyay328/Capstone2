import * as z from "zod";

// Request schema - contains all lab fields for updating
export const EditLabRequestSchema = z.object({
  id: z.string(), // UUID in format: YYYY-MM-DD-HH-MM-SS-uuidv4
  title: z.string()
});

// Response schema - boolean indicating success or failure
export const EditLabResponseSchema = z.object({
  success: z.boolean()
});

// TypeScript types
export type EditLabRequest = z.infer<typeof EditLabRequestSchema>;
export type EditLabResponse = z.infer<typeof EditLabResponseSchema>;
