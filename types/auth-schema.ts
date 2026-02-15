import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "validation.first_name_required"),
  lastName: z.string().min(1, "validation.last_name_required"),
  email: z.email("validation.email_invalid"),
  password: z
    .string()
    .min(8, "validation.password_min")
    .regex(/[a-z]/, "validation.password_lowercase")
    .regex(/[A-Z]/, "validation.password_uppercase")
    .regex(/[0-9]/, "validation.password_number")
    .regex(/[^a-zA-Z0-9]/, "validation.password_special"),
});

export type SignupData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email("validation.email_invalid"),
  password: z.string().min(1, "validation.password_required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(8, "validation.code_length")
    .regex(/^\d+$/, "validation.code_numeric"),
});

export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
