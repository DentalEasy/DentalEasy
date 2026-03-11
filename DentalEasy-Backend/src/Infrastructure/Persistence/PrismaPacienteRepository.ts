import { IPacienteRepository, Paciente } from '../../Domains/Paciente';
import { prisma } from './prisma-client';

export class PrismaPacienteRepository implements IPacienteRepository {
  async create(paciente: Paciente): Promise<Paciente> {
    const created = await prisma.paciente.create({
      data: {
        id: paciente.props.id,
        organizationId: paciente.props.organizationId,
        nome: paciente.props.nome,
        cpf: paciente.props.cpf,
        dataNascimento: paciente.props.dataNascimento,
        email: paciente.props.contato.email,
        telefone: paciente.props.contato.telefone,
        endereco: paciente.props.contato.endereco,
      },
    });

    return this.toDomain(created);
  }

  async update(paciente: Paciente): Promise<Paciente> {
    const updated = await prisma.paciente.update({
      where: { id: paciente.props.id },
      data: {
        nome: paciente.props.nome,
        dataNascimento: paciente.props.dataNascimento,
        email: paciente.props.contato.email,
        telefone: paciente.props.contato.telefone,
        endereco: paciente.props.contato.endereco,
      },
    });

    return this.toDomain(updated);
  }

  async findById(id: string, organizationId: string): Promise<Paciente | null> {
    const found = await prisma.paciente.findFirst({
      where: { id, organizationId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findByCpf(cpf: string, organizationId: string): Promise<Paciente | null> {
    const found = await prisma.paciente.findFirst({
      where: { cpf, organizationId },
    });

    return found ? this.toDomain(found) : null;
  }

  async listByOrganization(organizationId: string): Promise<Paciente[]> {
    const records = await prisma.paciente.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((item: (typeof records)[number]) => this.toDomain(item));
  }

  private toDomain(record: {
    id: string;
    organizationId: string;
    nome: string;
    cpf: string;
    dataNascimento: Date;
    email: string | null;
    telefone: string;
    endereco: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Paciente {
    return new Paciente({
      id: record.id,
      organizationId: record.organizationId,
      nome: record.nome,
      cpf: record.cpf,
      dataNascimento: record.dataNascimento,
      contato: {
        email: record.email ?? undefined,
        telefone: record.telefone,
        endereco: record.endereco ?? undefined,
      },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
