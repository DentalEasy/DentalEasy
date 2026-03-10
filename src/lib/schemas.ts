import { z } from "zod";

// ─── Helpers ───
const requiredString = (msg = "Campo obrigatório") => z.string().min(1, msg);
const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// ─── Patient ───
export const patientSchema = z.object({
  name: requiredString("Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: requiredString("Telefone é obrigatório").regex(phoneRegex, "Telefone inválido. Ex: (17) 99999-9999"),
  cpf: requiredString("CPF é obrigatório").regex(cpfRegex, "CPF inválido. Ex: 123.456.789-00"),
  birthDate: requiredString("Data de nascimento é obrigatória"),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// ─── Appointment ───
export const appointmentSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  dentistId: requiredString("Selecione um dentista"),
  date: requiredString("Data é obrigatória"),
  startTime: requiredString("Horário de início é obrigatório"),
  endTime: requiredString("Horário de término é obrigatório"),
  procedure: requiredString("Procedimento é obrigatório"),
  notes: z.string().optional(),
  sendWhatsApp: z.boolean(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// ─── Consultation (Prontuário entry) ───
export const consultationSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  type: z.enum(["PROCEDURE", "ANAMNESIS", "NOTE"], {
    message: "Selecione o tipo de registro",
  }),
  title: requiredString("Título é obrigatório"),
  description: requiredString("Descrição é obrigatória"),
});

export type ConsultationFormData = z.infer<typeof consultationSchema>;

// ─── Prescription ───
export const prescriptionSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  content: requiredString("Conteúdo da receita é obrigatório"),
});

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

// ─── Financial ───
export const financialSchema = z.object({
  patientId: requiredString("Selecione um paciente"),
  description: requiredString("Descrição é obrigatória"),
  amount: z.number({ message: "Valor inválido" }).positive("Valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"]),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"]).optional(),
  dueDate: requiredString("Vencimento é obrigatório"),
});

export type FinancialFormData = z.infer<typeof financialSchema>;
