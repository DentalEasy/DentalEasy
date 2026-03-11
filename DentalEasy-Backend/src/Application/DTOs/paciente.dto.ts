import { z } from 'zod';

export const createPacienteSchema = z.object({
  organizationId: z.string().uuid(),
  nome: z.string().min(2),
  cpf: z.string().min(11).max(14),
  dataNascimento: z.coerce.date(),
  contato: z.object({
    email: z.string().email().optional(),
    telefone: z.string().min(8),
    endereco: z.string().optional(),
  }),
});

export type CreatePacienteDTO = z.infer<typeof createPacienteSchema>;
