import { Consulta } from './Consulta';

export interface NotificacaoService {
  enviarLembreteConsulta(consulta: Consulta): Promise<void>;
}
