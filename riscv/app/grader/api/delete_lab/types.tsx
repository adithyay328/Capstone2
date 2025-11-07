import * as z from "zod";

// Request schema - contains just the id field (UID)
export const DeleteLabRequestSchema = z.object({
  id: z.string().min(1, "Lab ID is required")
});

// Response schema - boolean indicating success or failure
export const DeleteLabResponseSchema = z.object({
  success: z.boolean()
});

// TypeScript types
export type DeleteLabRequest = z.infer<typeof DeleteLabRequestSchema>;
export type DeleteLabResponse = z.infer<typeof DeleteLabResponseSchema>;
