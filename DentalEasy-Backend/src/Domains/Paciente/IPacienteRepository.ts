import { Paciente } from './Paciente';

export interface IPacienteRepository {
  create(paciente: Paciente): Promise<Paciente>;
  update(paciente: Paciente): Promise<Paciente>;
  findById(id: string, organizationId: string): Promise<Paciente | null>;
  findByCpf(cpf: string, organizationId: string): Promise<Paciente | null>;
  listByOrganization(organizationId: string): Promise<Paciente[]>;
}
