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

const treatmentPlanStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'REJECTED',
]);

const treatmentPlanItemSchema = z.object({
  procedureId: z.string().uuid().optional(),
  procedureName: optionalString,
  category: optionalString,
  tooth: optionalString,
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  notes: optionalString,
});

export const listTreatmentPlansQuerySchema = z.object({
  status: treatmentPlanStatusEnum.optional(),
  patientId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

export const createTreatmentPlanSchema = z.object({
  patientId: z.string().uuid(),
  title: optionalString,
  status: treatmentPlanStatusEnum.optional(),
  discount: z.coerce.number().nonnegative().optional(),
  notes: optionalString,
  installments: z.coerce.number().int().positive().optional(),
  items: z.array(treatmentPlanItemSchema).min(1),
});

export const updateTreatmentPlanSchema = z
  .object({
    patientId: z.string().uuid().optional(),
    title: optionalString,
    status: treatmentPlanStatusEnum.optional(),
    discount: z.coerce.number().nonnegative().optional(),
    notes: optionalString,
    installments: z.coerce.number().int().positive().optional(),
    items: z.array(treatmentPlanItemSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const updateTreatmentPlanStatusSchema = z.object({
  status: treatmentPlanStatusEnum,
});

export type TreatmentPlanItemDTO = z.infer<typeof treatmentPlanItemSchema>;
export type ListTreatmentPlansQueryDTO = z.infer<
  typeof listTreatmentPlansQuerySchema
>;
export type CreateTreatmentPlanDTO = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanDTO = z.infer<typeof updateTreatmentPlanSchema>;
export type UpdateTreatmentPlanStatusDTO = z.infer<
  typeof updateTreatmentPlanStatusSchema
>;
