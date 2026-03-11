import { NotificacaoService, Consulta } from '../../Domains/Agendamento';
import { WhatsAppApi } from '../ExternalApis/WhatsAppApi';

export class WhatsAppNotificacaoService implements NotificacaoService {
  constructor(private readonly whatsAppApi: WhatsAppApi) {}

  async enviarLembreteConsulta(consulta: Consulta): Promise<void> {
    await this.whatsAppApi.enviarMensagem(
      '00000000000',
      `Lembrete de consulta em ${consulta.dataHora.toISOString()}`,
    );
  }
}
