import * as z from "zod";

// Request schema - empty object
export const ListLabsRequestSchema = z.object({});

// Response schema - array of lab IDs
export const ListLabsResponseSchema = z.object({
  labIds: z.array(z.string())
});

// TypeScript types
export type ListLabsRequest = z.infer<typeof ListLabsRequestSchema>;
export type ListLabsResponse = z.infer<typeof ListLabsResponseSchema>;
