import { z } from 'zod';

// Request schema
export const CreateUserRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  instructor: z.boolean(),
});

// Response schema
export const CreateUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// TypeScript types
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
