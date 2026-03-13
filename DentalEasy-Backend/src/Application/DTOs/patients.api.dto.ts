import { z } from 'zod';

const cpfRegex = /^\d{11}$/;

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const listPatientsQuerySchema = z.object({
  search: z.string().trim().optional(),
  serasaStatus: z.enum(['GREEN', 'YELLOW', 'RED']).optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
});

export const createPatientSchema = z.object({
  name: z.string().trim().min(2),
  email: optionalString.refine(
    (value) => value === undefined || z.string().email().safeParse(value).success,
    { message: 'E-mail invalido.' },
  ),
  phone: z.string().trim().min(8),
  cpf: z.string().trim().transform((value) => value.replace(/\D/g, '')).refine((value) => cpfRegex.test(value), {
    message: 'CPF invalido. Informe 11 digitos.',
  }),
  birthDate: z.coerce.date(),
  avatarUrl: optionalString,
  serasaStatus: z.enum(['GREEN', 'YELLOW', 'RED']).optional(),
  address: optionalString,
  allergies: optionalString,
  medicalNotes: optionalString,
  active: z.boolean().optional(),
});

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export type ListPatientsQueryDTO = z.infer<typeof listPatientsQuerySchema>;
export type CreatePatientDTO = z.infer<typeof createPatientSchema>;
export type UpdatePatientDTO = z.infer<typeof updatePatientSchema>;
