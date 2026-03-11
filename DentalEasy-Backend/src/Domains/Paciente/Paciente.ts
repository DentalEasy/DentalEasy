import { ContatoPaciente } from './ContatoPaciente';

export interface PacienteProps {
  id: string;
  organizationId: string;
  nome: string;
  cpf: string;
  dataNascimento: Date;
  contato: ContatoPaciente;
  prontuarioId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Paciente {
  constructor(public readonly props: PacienteProps) {}

  static create(
    props: Omit<PacienteProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Paciente {
    const now = new Date();

    return new Paciente({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }
}
