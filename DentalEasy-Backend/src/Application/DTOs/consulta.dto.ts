import { z } from 'zod';

export const createConsultaSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  agendaId: z.string().uuid(),
  pacienteId: z.string().uuid(),
  dentistaId: z.string().uuid(),
  dataHora: z.coerce.date(),
  observacoes: z.string().optional(),
});

export type CreateConsultaDTO = z.infer<typeof createConsultaSchema>;
