import { z } from 'zod';
import {
  PrescriptionCategory,
  PrescriptionMedicationData,
  PrescriptionProfessionalOverride,
  PrescriptionScope,
  PrescriptionSupplementarySection,
  StructuredPrescriptionData,
} from './types';

const optionalTrimmedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : undefined;
  });

const medicationSchema = z.object({
  name: z.string().trim().min(1),
  dcb: optionalTrimmedString,
  pharmaceuticalForm: optionalTrimmedString,
  concentration: optionalTrimmedString,
  dosage: optionalTrimmedString,
  administrationRoute: optionalTrimmedString,
  treatmentDuration: optionalTrimmedString,
  quantity: optionalTrimmedString,
  additionalInstructions: optionalTrimmedString,
});

const supplementarySectionSchema = z
  .object({
    additionalGuidance: optionalTrimmedString,
    observations: optionalTrimmedString,
    rest: optionalTrimmedString,
    diet: optionalTrimmedString,
    adverseReactions: optionalTrimmedString,
    notes: optionalTrimmedString,
  })
  .transform((value) =>
    Object.values(value).some((entry) => entry !== undefined) ? value : undefined,
  );

const professionalOverrideSchema = z
  .object({
    displayName: optionalTrimmedString,
    councilLabel: optionalTrimmedString,
    specialty: optionalTrimmedString,
    email: optionalTrimmedString,
    phone: optionalTrimmedString,
    signatureLabel: optionalTrimmedString,
  })
  .transform((value) =>
    Object.values(value).some((entry) => entry !== undefined) ? value : undefined,
  );

const prescriptionScopeSchema = z
  .enum(['ODONTOLOGICAL', 'MEDICAL'])
  .transform(() => 'ODONTOLOGICAL' as const);

const structuredPrescriptionSchema = z.object({
  version: z.literal(1),
  scope: prescriptionScopeSchema.default('ODONTOLOGICAL'),
  category: z.enum(['SIMPLE', 'ANTIBIOTIC', 'CONTROLLED']).default('SIMPLE'),
  template: z.literal('BRAZIL_CLINIC_A5').default('BRAZIL_CLINIC_A5'),
  title: z.string().trim().min(1),
  content: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeMultilineText(value)),
  medications: z.array(medicationSchema).default([]),
  additionalInstructions: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeMultilineText(value)),
  observations: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeMultilineText(value)),
  supplementarySection: supplementarySectionSchema.optional(),
  requiresTwoCopies: z.boolean().default(false),
  includePatientAddress: z.boolean().default(false),
  controlledCategory: optionalTrimmedString,
  issuePlace: optionalTrimmedString,
  professionalOverride: professionalOverrideSchema.optional(),
  legacyContentLines: z.array(z.string().trim().min(1)).optional(),
});

export interface PrescriptionDraftInput {
  scope?: PrescriptionScope;
  category?: PrescriptionCategory;
  title?: string;
  content?: string;
  medications?: PrescriptionMedicationData[];
  additionalInstructions?: string;
  observations?: string;
  supplementarySection?: PrescriptionSupplementarySection;
  requiresTwoCopies?: boolean;
  includePatientAddress?: boolean;
  controlledCategory?: string;
  issuePlace?: string;
  professionalOverride?: PrescriptionProfessionalOverride;
}

const buildDefaultTitle = (
  _scope: PrescriptionScope,
  category: PrescriptionCategory,
): string => {
  if (category === 'CONTROLLED') {
    return 'Receituario Odontologico de Controle Especial';
  }

  return 'Receituario Odontologico';
};

export const normalizeMultilineText = (
  value: string | null | undefined,
): string | undefined => {
  if (value == null) {
    return undefined;
  }

  const normalized = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeMedication = (
  medication: PrescriptionMedicationData,
): PrescriptionMedicationData => ({
  name: medication.name.trim(),
  dcb: medication.dcb?.trim() || undefined,
  pharmaceuticalForm: medication.pharmaceuticalForm?.trim() || undefined,
  concentration: medication.concentration?.trim() || undefined,
  dosage: normalizeMultilineText(medication.dosage),
  administrationRoute: medication.administrationRoute?.trim() || undefined,
  treatmentDuration: medication.treatmentDuration?.trim() || undefined,
  quantity: medication.quantity?.trim() || undefined,
  additionalInstructions: normalizeMultilineText(medication.additionalInstructions),
});

const medicationToSummary = (
  medication: PrescriptionMedicationData,
  index: number,
): string => {
  const headlineParts = [
    `${index + 1}. ${medication.name}`,
    medication.dcb ? `(DCB: ${medication.dcb})` : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  const detailParts = [
    medication.pharmaceuticalForm,
    medication.concentration,
    medication.administrationRoute ? `via ${medication.administrationRoute}` : undefined,
    medication.treatmentDuration ? `por ${medication.treatmentDuration}` : undefined,
    medication.quantity ? `quantidade: ${medication.quantity}` : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  const lines = [headlineParts.join(' ')];
  if (detailParts.length > 0) {
    lines.push(detailParts.join(' | '));
  }
  if (medication.dosage) {
    lines.push(`Posologia: ${medication.dosage.replace(/\n/g, ' ')}`);
  }
  if (medication.additionalInstructions) {
    lines.push(`Orientacoes: ${medication.additionalInstructions.replace(/\n/g, ' ')}`);
  }

  return lines.join('\n');
};

export const buildPrescriptionContentPreview = (
  prescription: StructuredPrescriptionData,
): string => {
  const blocks: string[] = [];

  if (prescription.medications.length > 0) {
    blocks.push(
      prescription.medications
        .map((medication, index) => medicationToSummary(medication, index))
        .join('\n\n'),
    );
  } else if (prescription.content) {
    blocks.push(prescription.content);
  } else if (prescription.legacyContentLines?.length) {
    blocks.push(prescription.legacyContentLines.join('\n'));
  }

  if (prescription.additionalInstructions) {
    blocks.push(`Orientacoes gerais:\n${prescription.additionalInstructions}`);
  }

  if (prescription.observations) {
    blocks.push(`Observacoes:\n${prescription.observations}`);
  }

  return blocks.filter((block) => block.trim().length > 0).join('\n\n');
};

export const createStructuredPrescriptionData = (
  input: PrescriptionDraftInput,
): StructuredPrescriptionData => {
  const scope = input.scope ?? 'ODONTOLOGICAL';
  const category = input.category ?? 'SIMPLE';
  const medications = (input.medications ?? [])
    .map((medication) => normalizeMedication(medication))
    .filter((medication) => medication.name.length > 0);

  const content = normalizeMultilineText(input.content);
  const additionalInstructions = normalizeMultilineText(input.additionalInstructions);
  const observations = normalizeMultilineText(input.observations);
  const title = input.title?.trim() || buildDefaultTitle(scope, category);
  const includePatientAddress = Boolean(input.includePatientAddress);
  const requiresTwoCopies =
    Boolean(input.requiresTwoCopies) || category === 'CONTROLLED';

  const structured: StructuredPrescriptionData = {
    version: 1,
    scope,
    category,
    template: 'BRAZIL_CLINIC_A5',
    title,
    content,
    medications,
    additionalInstructions,
    observations,
    supplementarySection:
      input.supplementarySection
        && Object.values(input.supplementarySection).some((value) =>
          normalizeMultilineText(value),
        )
        ? {
            additionalGuidance: normalizeMultilineText(
              input.supplementarySection.additionalGuidance,
            ),
            observations: normalizeMultilineText(input.supplementarySection.observations),
            rest: normalizeMultilineText(input.supplementarySection.rest),
            diet: normalizeMultilineText(input.supplementarySection.diet),
            adverseReactions: normalizeMultilineText(
              input.supplementarySection.adverseReactions,
            ),
            notes: normalizeMultilineText(input.supplementarySection.notes),
          }
        : undefined,
    requiresTwoCopies,
    includePatientAddress,
    controlledCategory: input.controlledCategory?.trim() || undefined,
    issuePlace: input.issuePlace?.trim() || undefined,
    professionalOverride:
      input.professionalOverride
        && Object.values(input.professionalOverride).some((value) =>
          normalizeMultilineText(value),
        )
        ? {
            displayName: input.professionalOverride.displayName?.trim() || undefined,
            councilLabel: input.professionalOverride.councilLabel?.trim() || undefined,
            specialty: input.professionalOverride.specialty?.trim() || undefined,
            email: input.professionalOverride.email?.trim() || undefined,
            phone: input.professionalOverride.phone?.trim() || undefined,
            signatureLabel:
              input.professionalOverride.signatureLabel?.trim() || undefined,
          }
        : undefined,
    legacyContentLines: undefined,
  };

  if (structured.medications.length === 0 && !structured.content) {
    structured.legacyContentLines = ['Prescricao nao informada.'];
  }

  return structuredPrescriptionSchema.parse(structured);
};

export const parseStructuredPrescriptionData = (
  value: unknown,
): StructuredPrescriptionData | undefined => {
  const result = structuredPrescriptionSchema.safeParse(value);
  return result.success ? result.data : undefined;
};

export const buildLegacyPrescriptionData = (
  rawContent: string | null | undefined,
): StructuredPrescriptionData => {
  const content = normalizeMultilineText(rawContent);
  const lines = content?.split('\n').filter((line) => line.trim().length > 0) ?? [];

  return structuredPrescriptionSchema.parse({
    version: 1,
    scope: 'ODONTOLOGICAL',
    category: 'SIMPLE',
    template: 'BRAZIL_CLINIC_A5',
    title: 'Receituario Odontologico',
    content,
    medications: [],
    requiresTwoCopies: false,
    includePatientAddress: false,
    legacyContentLines: lines.length > 0 ? lines : ['Prescricao nao informada.'],
  });
};

export const resolvePrescriptionData = (
  metadata: unknown,
  rawContent: string | null | undefined,
): StructuredPrescriptionData => parseStructuredPrescriptionData(metadata)
  ?? buildLegacyPrescriptionData(rawContent);
