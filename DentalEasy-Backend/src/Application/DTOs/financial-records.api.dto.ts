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

export const listFinancialRecordsQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  paymentStatus: z.enum(['PAID', 'PENDING', 'OVERDUE', 'CANCELLED']).optional(),
  category: z.string().trim().optional(),
  patientId: z.string().uuid().optional(),
  dueDateFrom: z.string().trim().optional(),
  dueDateTo: z.string().trim().optional(),
  periodFrom: z.string().trim().optional(),
  periodTo: z.string().trim().optional(),
});

export const createFinancialRecordSchema = z.object({
  description: z.string().trim().min(2),
  amount: z.coerce.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: optionalString,
  paymentStatus: z.enum(['PAID', 'PENDING', 'OVERDUE', 'CANCELLED']).optional(),
  paymentMethod: z
    .enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO'])
    .optional(),
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().optional(),
  patientId: z.string().uuid().optional(),
  notes: optionalString,
  invoiceNumber: optionalString,
  fiscalDocumentRef: optionalString,
  nfeStatus: z.enum(['ISSUED', 'PENDING', 'ERROR']).optional(),
});

export const updateFinancialRecordSchema = createFinancialRecordSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export type ListFinancialRecordsQueryDTO = z.infer<
  typeof listFinancialRecordsQuerySchema
>;
export type CreateFinancialRecordDTO = z.infer<typeof createFinancialRecordSchema>;
export type UpdateFinancialRecordDTO = z.infer<typeof updateFinancialRecordSchema>;
