import { Prontuario } from './Prontuario';

export interface IProntuarioRepository {
  findByPacienteId(
    pacienteId: string,
    organizationId: string,
  ): Promise<Prontuario | null>;
  save(prontuario: Prontuario): Promise<Prontuario>;
}
