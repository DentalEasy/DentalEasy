import { z } from 'zod';

export const listPrescriptionsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  content: z.string().trim().min(3),
});

export const exportPrescriptionQuerySchema = z.object({
  format: z
    .enum(['docx'])
    .default('docx')
    .transform((value) => value.toLowerCase()),
});

export type ListPrescriptionsQueryDTO = z.infer<typeof listPrescriptionsQuerySchema>;
export type CreatePrescriptionDTO = z.infer<typeof createPrescriptionSchema>;
export type ExportPrescriptionQueryDTO = z.infer<
  typeof exportPrescriptionQuerySchema
>;
