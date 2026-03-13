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

const paymentMethodEnum = z.enum([
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'BOLETO',
]);

const paymentStatusEnum = z.enum(['PENDING', 'SETTLED', 'CANCELLED']);

export const listPaymentsQuerySchema = z.object({
  financialRecordId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: paymentStatusEnum.optional(),
  method: paymentMethodEnum.optional(),
});

export const createPaymentSchema = z.object({
  financialRecordId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: paymentMethodEnum,
  status: paymentStatusEnum.optional(),
  paidAt: z.coerce.date().optional(),
  receivedFrom: optionalString,
  paidTo: optionalString,
  notes: optionalString,
  installmentNumber: z.coerce.number().int().positive().optional(),
  totalInstallments: z.coerce.number().int().positive().optional(),
  receiptNumber: optionalString,
});

export const settlePaymentSchema = z.object({
  paidAt: z.coerce.date().optional(),
  notes: optionalString,
});

export const updatePaymentSchema = z
  .object({
    amount: z.coerce.number().positive().optional(),
    method: paymentMethodEnum.optional(),
    status: paymentStatusEnum.optional(),
    paidAt: z.coerce.date().optional(),
    receivedFrom: optionalString,
    paidTo: optionalString,
    notes: optionalString,
    installmentNumber: z.coerce.number().int().positive().optional(),
    totalInstallments: z.coerce.number().int().positive().optional(),
    receiptNumber: optionalString,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export type ListPaymentsQueryDTO = z.infer<typeof listPaymentsQuerySchema>;
export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type SettlePaymentDTO = z.infer<typeof settlePaymentSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
