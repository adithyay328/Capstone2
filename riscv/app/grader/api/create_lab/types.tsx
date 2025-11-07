import * as z from "zod";

// Request schema - contains just the title field
export const CreateLabRequestSchema = z.object({
  title: z.string().min(1, "Title is required")
});

// Response schema - boolean indicating success or failure
export const CreateLabResponseSchema = z.object({
  success: z.boolean()
});

// TypeScript types
export type CreateLabRequest = z.infer<typeof CreateLabRequestSchema>;
export type CreateLabResponse = z.infer<typeof CreateLabResponseSchema>;
