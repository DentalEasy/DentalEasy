export class SerasaApi {
  async consultarCpf(cpf: string): Promise<{ cpf: string; score: number }> {
    return {
      cpf,
      score: 700,
    };
  }
}
