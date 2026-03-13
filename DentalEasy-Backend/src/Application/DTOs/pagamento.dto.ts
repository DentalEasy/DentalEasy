import { z } from 'zod';

export const createPagamentoSchema = z.object({
  id: z.string().uuid().optional(),
  pacienteId: z.string().uuid(),
  valor: z.number().positive(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).default('PENDENTE'),
  boleto: z.object({
    id: z.string().uuid().optional(),
    codigoBarras: z.string().min(10),
    vencimento: z.coerce.date(),
  }),
  notaFiscal: z
    .object({
      id: z.string().uuid().optional(),
      numero: z.string(),
      chaveAcesso: z.string().optional(),
      emitidaEm: z.coerce.date(),
    })
    .optional(),
});

export type CreatePagamentoDTO = z.infer<typeof createPagamentoSchema>;
