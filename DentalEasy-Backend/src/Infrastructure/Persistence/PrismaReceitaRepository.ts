import { IReceitaRepository, Receita } from '../../Domains/Receituario';
import { prisma } from './prisma-client';

export class PrismaReceitaRepository implements IReceitaRepository {
  async create(receita: Receita): Promise<Receita> {
    const created = await prisma.receita.create({
      data: {
        id: receita.id,
        organizationId: receita.organizationId,
        dentistaId: receita.dentistaId,
        pacienteId: receita.pacienteId,
        conteudo: receita.conteudo,
        createdAt: receita.createdAt,
      },
    });

    return created;
  }

  async findById(id: string, organizationId: string): Promise<Receita | null> {
    return prisma.receita.findFirst({
      where: { id, organizationId },
    });
  }

  async listByOrganization(organizationId: string): Promise<Receita[]> {
    return prisma.receita.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
