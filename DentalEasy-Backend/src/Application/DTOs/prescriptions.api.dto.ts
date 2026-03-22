import { z } from 'zod';

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim().replace(/\s+/g, ' ');
    return trimmed.length > 0 ? trimmed : undefined;
  });

const optionalMultilineString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const normalized = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return normalized.length > 0 ? normalized : undefined;
  });

const medicationSchema = z.object({
  name: z.string().trim().min(1),
  dcb: optionalString,
  pharmaceuticalForm: optionalString,
  concentration: optionalString,
  dosage: optionalMultilineString,
  administrationRoute: optionalString,
  treatmentDuration: optionalString,
  quantity: optionalString,
  additionalInstructions: optionalMultilineString,
});

const supplementarySectionSchema = z.object({
  additionalGuidance: optionalMultilineString,
  observations: optionalMultilineString,
  rest: optionalMultilineString,
  diet: optionalMultilineString,
  adverseReactions: optionalMultilineString,
  notes: optionalMultilineString,
});

const professionalOverrideSchema = z.object({
  displayName: optionalString,
  councilLabel: optionalString,
  specialty: optionalString,
  email: optionalString,
  phone: optionalString,
  signatureLabel: optionalString,
});

export const listPrescriptionsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
});

export const createPrescriptionSchema = z
  .object({
    patientId: z.string().uuid(),
    scope: z.enum(['ODONTOLOGICAL']).optional(),
    category: z.enum(['SIMPLE', 'ANTIBIOTIC', 'CONTROLLED']).optional(),
    title: optionalString,
    content: optionalMultilineString,
    medications: z.array(medicationSchema).max(12).optional(),
    additionalInstructions: optionalMultilineString,
    observations: optionalMultilineString,
    supplementarySection: supplementarySectionSchema.optional(),
    requiresTwoCopies: z.boolean().optional(),
    includePatientAddress: z.boolean().optional(),
    controlledCategory: optionalString,
    issuePlace: optionalString,
    professionalOverride: professionalOverrideSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(value.content);
    const hasMedications = (value.medications ?? []).length > 0;

    if (!hasContent && !hasMedications) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe ao menos um medicamento ou um conteudo livre.',
        path: ['content'],
      });
    }
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
