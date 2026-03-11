import { IProntuarioRepository, Prontuario } from '../../Domains/Prontuario';
import { prisma } from './prisma-client';

export class PrismaProntuarioRepository implements IProntuarioRepository {
  async findByPacienteId(
    pacienteId: string,
    organizationId: string,
  ): Promise<Prontuario | null> {
    const found = await prisma.prontuario.findFirst({
      where: { pacienteId, organizationId },
      include: {
        tratamentos: true,
        diagnosticos: true,
      },
    });

    if (!found) {
      return null;
    }

    return new Prontuario({
      id: found.id,
      organizationId: found.organizationId,
      pacienteId: found.pacienteId,
      tratamentos: found.tratamentos,
      diagnosticos: found.diagnosticos,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async save(prontuario: Prontuario): Promise<Prontuario> {
    const upserted = await prisma.prontuario.upsert({
      where: { id: prontuario.props.id },
      update: {
        updatedAt: prontuario.props.updatedAt,
      },
      create: {
        id: prontuario.props.id,
        organizationId: prontuario.props.organizationId,
        pacienteId: prontuario.props.pacienteId,
      },
      include: {
        tratamentos: true,
        diagnosticos: true,
      },
    });

    await prisma.tratamento.deleteMany({
      where: { prontuarioId: upserted.id },
    });

    await prisma.diagnostico.deleteMany({
      where: { prontuarioId: upserted.id },
    });

    if (prontuario.props.tratamentos.length > 0) {
      await prisma.tratamento.createMany({
        data: prontuario.props.tratamentos.map((item) => ({
          id: item.id,
          prontuarioId: upserted.id,
          descricao: item.descricao,
          data: item.data,
        })),
      });
    }

    if (prontuario.props.diagnosticos.length > 0) {
      await prisma.diagnostico.createMany({
        data: prontuario.props.diagnosticos.map((item) => ({
          id: item.id,
          prontuarioId: upserted.id,
          descricao: item.descricao,
          data: item.data,
        })),
      });
    }

    const reloaded = await prisma.prontuario.findUniqueOrThrow({
      where: { id: upserted.id },
      include: {
        tratamentos: true,
        diagnosticos: true,
      },
    });

    return new Prontuario({
      id: reloaded.id,
      organizationId: reloaded.organizationId,
      pacienteId: reloaded.pacienteId,
      tratamentos: reloaded.tratamentos,
      diagnosticos: reloaded.diagnosticos,
      createdAt: reloaded.createdAt,
      updatedAt: reloaded.updatedAt,
    });
  }
}
