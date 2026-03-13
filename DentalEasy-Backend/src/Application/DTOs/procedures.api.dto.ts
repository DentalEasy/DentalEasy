import { z } from 'zod';

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const listProceduresQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export const createProcedureSchema = z.object({
  name: z.string().trim().min(2),
  description: optionalString,
  category: optionalString,
  price: z.coerce.number().positive(),
  durationMinutes: z.coerce.number().int().positive(),
  active: z.boolean().optional(),
});

export const updateProcedureSchema = createProcedureSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const toggleProcedureSchema = z.object({
  active: z.boolean().optional(),
});

export type ListProceduresQueryDTO = z.infer<typeof listProceduresQuerySchema>;
export type CreateProcedureDTO = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureDTO = z.infer<typeof updateProcedureSchema>;
export type ToggleProcedureDTO = z.infer<typeof toggleProcedureSchema>;
