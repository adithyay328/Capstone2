import { z } from 'zod';

// Schema for the login request
export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Schema for the login response
export const LoginResponseSchema = z.object({
  username: z.string(),
  success: z.boolean(),
  student: z.boolean().optional(),
  message: z.string().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
