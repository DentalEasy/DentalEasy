import { z } from 'zod';
import { isStrongPassword } from '../../shared/password-policy';

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  mfaCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/)
    .optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40),
  password: z
    .string()
    .min(1)
    .refine((value) => isStrongPassword(value), {
      message: 'Senha nao atende aos requisitos de seguranca.',
    }),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type RevokeSessionDTO = z.infer<typeof revokeSessionSchema>;
