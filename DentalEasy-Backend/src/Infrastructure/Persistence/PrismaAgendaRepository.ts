import { Agenda, Consulta, IAgendaRepository } from '../../Domains/Agendamento';
import { prisma } from './prisma-client';

export class PrismaAgendaRepository implements IAgendaRepository {
  async findAgendaByDentistaId(
    dentistaId: string,
    organizationId: string,
  ): Promise<Agenda | null> {
    const found = await prisma.agenda.findFirst({
      where: { dentistaId, organizationId },
      include: { consultas: true },
    });

    if (!found) {
      return null;
    }

    return {
      id: found.id,
      organizationId: found.organizationId,
      dentistaId: found.dentistaId,
      consultas: found.consultas,
    };
  }

  async createConsulta(consulta: Consulta): Promise<Consulta> {
    const created = await prisma.consulta.create({
      data: {
        id: consulta.id,
        organizationId: consulta.organizationId,
        agendaId: consulta.agendaId,
        pacienteId: consulta.pacienteId,
        dentistaId: consulta.dentistaId,
        dataHora: consulta.dataHora,
        observacoes: consulta.observacoes,
      },
    });

    return created;
  }

  async listConsultasByOrganization(organizationId: string): Promise<Consulta[]> {
    const records = await prisma.consulta.findMany({
      where: { organizationId },
      orderBy: { dataHora: 'asc' },
    });

    return records;
  }
}
