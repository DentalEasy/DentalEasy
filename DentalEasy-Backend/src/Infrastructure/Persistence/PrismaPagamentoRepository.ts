import { IPagamentoRepository, Pagamento } from '../../Domains/Financeiro';
import { prisma } from './prisma-client';

export class PrismaPagamentoRepository implements IPagamentoRepository {
  async create(pagamento: Pagamento): Promise<Pagamento> {
    const created = await prisma.pagamento.create({
      data: {
        id: pagamento.props.id,
        organizationId: pagamento.props.organizationId,
        pacienteId: pagamento.props.pacienteId,
        valor: pagamento.props.valor,
        status: pagamento.props.status,
        boleto: {
          create: {
            id: pagamento.props.boleto.id,
            codigoBarras: pagamento.props.boleto.codigoBarras,
            vencimento: pagamento.props.boleto.vencimento,
          },
        },
        notaFiscal: pagamento.props.notaFiscal
          ? {
              create: {
                id: pagamento.props.notaFiscal.id,
                numero: pagamento.props.notaFiscal.numero,
                chaveAcesso: pagamento.props.notaFiscal.chaveAcesso,
                emitidaEm: pagamento.props.notaFiscal.emitidaEm,
              },
            }
          : undefined,
      },
      include: { boleto: true, notaFiscal: true },
    });

    return this.toDomain(created);
  }

  async update(pagamento: Pagamento): Promise<Pagamento> {
    const updated = await prisma.pagamento.update({
      where: { id: pagamento.props.id },
      data: {
        status: pagamento.props.status,
      },
      include: { boleto: true, notaFiscal: true },
    });

    return this.toDomain(updated);
  }

  async findById(id: string, organizationId: string): Promise<Pagamento | null> {
    const found = await prisma.pagamento.findFirst({
      where: { id, organizationId },
      include: { boleto: true, notaFiscal: true },
    });

    return found ? this.toDomain(found) : null;
  }

  async listByOrganization(organizationId: string): Promise<Pagamento[]> {
    const found = await prisma.pagamento.findMany({
      where: { organizationId },
      include: { boleto: true, notaFiscal: true },
      orderBy: { createdAt: 'desc' },
    });

    return found.map((item: (typeof found)[number]) => this.toDomain(item));
  }

  private toDomain(record: {
    id: string;
    organizationId: string;
    pacienteId: string;
    valor: { toNumber(): number };
    status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
    createdAt: Date;
    updatedAt: Date;
    boleto: {
      id: string;
      codigoBarras: string;
      vencimento: Date;
    } | null;
    notaFiscal: {
      id: string;
      numero: string;
      chaveAcesso: string | null;
      emitidaEm: Date;
    } | null;
  }): Pagamento {
    if (!record.boleto) {
      throw new Error('Pagamento sem boleto nao e permitido.');
    }

    return new Pagamento({
      id: record.id,
      organizationId: record.organizationId,
      pacienteId: record.pacienteId,
      valor: record.valor.toNumber(),
      status: record.status,
      boleto: {
        id: record.boleto.id,
        codigoBarras: record.boleto.codigoBarras,
        vencimento: record.boleto.vencimento,
      },
      notaFiscal: record.notaFiscal
        ? {
            id: record.notaFiscal.id,
            numero: record.notaFiscal.numero,
            chaveAcesso: record.notaFiscal.chaveAcesso ?? undefined,
            emitidaEm: record.notaFiscal.emitidaEm,
          }
        : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
