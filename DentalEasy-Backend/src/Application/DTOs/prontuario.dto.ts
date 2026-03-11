import { z } from 'zod';

export const addTratamentoSchema = z.object({
  pacienteId: z.string().uuid(),
  descricao: z.string().min(3),
  data: z.coerce.date(),
});

export const addDiagnosticoSchema = z.object({
  pacienteId: z.string().uuid(),
  descricao: z.string().min(3),
  data: z.coerce.date(),
});

export type AddTratamentoDTO = z.infer<typeof addTratamentoSchema>;
export type AddDiagnosticoDTO = z.infer<typeof addDiagnosticoSchema>;
