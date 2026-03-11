export class FazendaApi {
  async emitirNotaFiscal(payload: {
    organizationId: string;
    pagamentoId: string;
    valor: number;
  }): Promise<{ numero: string; chaveAcesso: string }> {
    return {
      numero: `NF-${payload.pagamentoId.slice(0, 8)}`,
      chaveAcesso: crypto.randomUUID().replace(/-/g, ''),
    };
  }
}
