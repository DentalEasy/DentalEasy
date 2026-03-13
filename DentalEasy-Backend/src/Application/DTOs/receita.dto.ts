import { z } from 'zod';

export const createReceitaSchema = z.object({
  id: z.string().uuid().optional(),
  dentistaId: z.string().uuid(),
  pacienteId: z.string().uuid(),
  conteudo: z.string().min(3),
});

export type CreateReceitaDTO = z.infer<typeof createReceitaSchema>;
