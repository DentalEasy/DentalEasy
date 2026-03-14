import { z } from 'zod';
import { isStrongPassword } from '../../shared/password-policy';

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const optionalPassword = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .refine((value) => value === undefined || isStrongPassword(value), {
    message: 'Senha nao atende aos requisitos de seguranca.',
  });

export const updateOrganizationSettingsSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    document: optionalString,
    email: optionalString.refine(
      (value) => value === undefined || z.string().email().safeParse(value).success,
      { message: 'E-mail invalido.' },
    ),
    phone: optionalString,
    address: optionalString,
    city: optionalString,
    state: optionalString,
    logoUrl: optionalString,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const createTeamMemberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.enum(['ADMIN', 'SECRETARY', 'DENTIST']),
  password: optionalPassword,
  avatarUrl: optionalString,
  active: z.boolean().optional(),
});

export const updateTeamMemberSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(['ADMIN', 'SECRETARY', 'DENTIST']).optional(),
    password: optionalPassword,
    avatarUrl: optionalString,
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const updateNotificationPreferencesSchema = z
  .object({
    appointmentReminders: z.boolean().optional(),
    paymentAlerts: z.boolean().optional(),
    inventoryAlerts: z.boolean().optional(),
    systemAlerts: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export type UpdateOrganizationSettingsDTO = z.infer<
  typeof updateOrganizationSettingsSchema
>;
export type CreateTeamMemberDTO = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberDTO = z.infer<typeof updateTeamMemberSchema>;
export type UpdateNotificationPreferencesDTO = z.infer<
  typeof updateNotificationPreferencesSchema
>;
