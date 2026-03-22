export type PrescriptionScope = 'ODONTOLOGICAL';

export type PrescriptionCategory = 'SIMPLE' | 'ANTIBIOTIC' | 'CONTROLLED';

export interface PrescriptionMedicationData {
  name: string;
  dcb?: string;
  pharmaceuticalForm?: string;
  concentration?: string;
  dosage?: string;
  administrationRoute?: string;
  treatmentDuration?: string;
  quantity?: string;
  additionalInstructions?: string;
}

export interface PrescriptionSupplementarySection {
  additionalGuidance?: string;
  observations?: string;
  rest?: string;
  diet?: string;
  adverseReactions?: string;
  notes?: string;
}

export interface PrescriptionProfessionalOverride {
  displayName?: string;
  councilLabel?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  signatureLabel?: string;
}

export interface StructuredPrescriptionData {
  version: 1;
  scope: PrescriptionScope;
  category: PrescriptionCategory;
  template: 'BRAZIL_CLINIC_A5';
  title: string;
  content?: string;
  medications: PrescriptionMedicationData[];
  additionalInstructions?: string;
  observations?: string;
  supplementarySection?: PrescriptionSupplementarySection;
  requiresTwoCopies: boolean;
  includePatientAddress: boolean;
  controlledCategory?: string;
  issuePlace?: string;
  professionalOverride?: PrescriptionProfessionalOverride;
  legacyContentLines?: string[];
}

export interface PrescriptionOrganizationContext {
  name: string;
  logoUrl?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface PrescriptionPatientContext {
  name: string;
  birthDate: Date;
  cpf: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PrescriptionProfessionalContext {
  displayName: string;
  councilLabel?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  signatureLabel?: string;
}

export interface PrescriptionDocxRenderInput {
  organization: PrescriptionOrganizationContext;
  patient: PrescriptionPatientContext;
  professional: PrescriptionProfessionalContext;
  prescription: StructuredPrescriptionData;
  issuedAt: Date;
}
