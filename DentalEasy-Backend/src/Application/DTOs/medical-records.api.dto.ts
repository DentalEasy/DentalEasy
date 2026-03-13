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

export const listMedicalRecordsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  type: z.enum(['PROCEDURE', 'ANAMNESIS', 'PHOTO', 'NOTE']).optional(),
});

export const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid(),
  type: z.enum(['PROCEDURE', 'ANAMNESIS', 'PHOTO', 'NOTE']),
  title: z.string().trim().min(2),
  description: z.string().trim().min(2),
  attachments: z.array(z.string().trim().min(1)).optional(),
});

export const updateMedicalRecordSchema = z
  .object({
    type: z.enum(['PROCEDURE', 'ANAMNESIS', 'PHOTO', 'NOTE']).optional(),
    title: optionalString,
    description: optionalString,
    attachments: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export type ListMedicalRecordsQueryDTO = z.infer<
  typeof listMedicalRecordsQuerySchema
>;
export type CreateMedicalRecordDTO = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordDTO = z.infer<typeof updateMedicalRecordSchema>;
