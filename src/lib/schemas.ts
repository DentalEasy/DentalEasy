import { z } from "zod";

const requiredString = (msg = "Campo obrigatorio") =>
  z.string().trim().min(1, msg);
const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });
const optionalMultilineString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return undefined;
    const normalized = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
    return normalized.length > 0 ? normalized : undefined;
  });

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

export const patientSchema = z.object({
  name: requiredString("Nome e obrigatorio"),
  email: z.string().email("E-mail invalido").optional().or(z.literal("")),
  phone: requiredString("Telefone e obrigatorio").regex(
    phoneRegex,
    "Telefone invalido. Ex: (17) 99999-9999"
  ),
  cpf: requiredString("CPF e obrigatorio").regex(
    cpfRegex,
    "CPF invalido. Ex: 123.456.789-00"
  ),
  birthDate: requiredString("Data de nascimento e obrigatoria"),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export const appointmentSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  dentistId: requiredString("Selecione um dentista"),
  date: requiredString("Data e obrigatoria"),
  startTime: requiredString("Horario de inicio e obrigatorio"),
  endTime: requiredString("Horario de termino e obrigatorio"),
  procedure: requiredString("Procedimento e obrigatorio"),
  notes: z.string().optional(),
  sendWhatsApp: z.boolean(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const consultationSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  type: z.enum(["PROCEDURE", "ANAMNESIS", "NOTE"], {
    message: "Selecione o tipo de registro",
  }),
  title: requiredString("Titulo e obrigatorio"),
  description: requiredString("Descricao e obrigatoria"),
});

export type ConsultationFormData = z.infer<typeof consultationSchema>;

const prescriptionMedicationSchema = z.object({
  name: z.string().default(""),
  dcb: optionalString,
  pharmaceuticalForm: optionalString,
  concentration: optionalString,
  dosage: optionalMultilineString,
  administrationRoute: optionalString,
  treatmentDuration: optionalString,
  quantity: optionalString,
  additionalInstructions: optionalMultilineString,
});

export const prescriptionSchema = z
  .object({
    patientId: requiredString("Selecione um paciente"),
    scope: z.enum(["ODONTOLOGICAL"]).default("ODONTOLOGICAL"),
    category: z.enum(["SIMPLE", "ANTIBIOTIC", "CONTROLLED"]).default("SIMPLE"),
    title: optionalString,
    content: optionalMultilineString,
    medications: z.array(prescriptionMedicationSchema).min(1).default([
      {
        name: "",
        dcb: "",
        pharmaceuticalForm: "",
        concentration: "",
        dosage: "",
        administrationRoute: "",
        treatmentDuration: "",
        quantity: "",
        additionalInstructions: "",
      },
    ]),
    additionalInstructions: optionalMultilineString,
    observations: optionalMultilineString,
    supplementarySection: z
      .object({
        additionalGuidance: optionalMultilineString,
        observations: optionalMultilineString,
        rest: optionalMultilineString,
        diet: optionalMultilineString,
        adverseReactions: optionalMultilineString,
        notes: optionalMultilineString,
      })
      .default({
        additionalGuidance: "",
        observations: "",
        rest: "",
        diet: "",
        adverseReactions: "",
        notes: "",
      }),
    requiresTwoCopies: z.boolean().default(false),
    includePatientAddress: z.boolean().default(false),
    controlledCategory: optionalString,
    issuePlace: optionalString,
    professionalOverride: z
      .object({
        displayName: optionalString,
        councilLabel: optionalString,
        specialty: optionalString,
        email: optionalString,
        phone: optionalString,
        signatureLabel: optionalString,
      })
      .default({
        displayName: "",
        councilLabel: "",
        specialty: "",
        email: "",
        phone: "",
        signatureLabel: "",
      }),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(value.content);
    const hasMedication = value.medications.some(
      (medication) => medication.name.trim().length > 0
    );

    if (!hasContent && !hasMedication) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe ao menos um medicamento ou uma prescricao livre.",
        path: ["content"],
      });
    }
  });

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
export type PrescriptionFormValues = z.input<typeof prescriptionSchema>;

export const financialSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  description: requiredString("Descricao e obrigatoria"),
  amount: z
    .number({ message: "Valor invalido" })
    .positive("Valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"]),
  paymentMethod: z
    .enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"])
    .optional(),
  dueDate: requiredString("Vencimento e obrigatorio"),
});

export type FinancialFormData = z.infer<typeof financialSchema>;
