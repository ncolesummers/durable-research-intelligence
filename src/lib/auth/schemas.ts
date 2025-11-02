/**
 * Zod schemas used for validating authentication forms.
 */

import { z } from "zod";

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup form schema
 */
export const signupSchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
