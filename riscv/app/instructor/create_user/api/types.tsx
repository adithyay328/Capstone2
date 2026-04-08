import { z } from 'zod';

export const CreateUserRoleSchema = z.enum(["student", "ta", "instructor"]);

// Request schema
export const CreateUserRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  asuid: z.string().regex(/^[0-9]{10}$/, "ASU ID must be exactly 10 digits"),
  password: z.string().min(1, "Password is required"),
  role: CreateUserRoleSchema,
});

// Response schema
export const CreateUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// TypeScript types
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type CreateUserRole = z.infer<typeof CreateUserRoleSchema>;
