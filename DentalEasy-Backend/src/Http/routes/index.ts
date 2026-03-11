import { Router } from 'express';
import { agendamentoRoutes } from './agendamento.routes';
import { financeiroRoutes } from './financeiro.routes';
import { pacienteRoutes } from './paciente.routes';
import { prontuarioRoutes } from './prontuario.routes';
import { receituarioRoutes } from './receituario.routes';

const router = Router();

router.use('/pacientes', pacienteRoutes);
router.use('/agendamento', agendamentoRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/prontuario', prontuarioRoutes);
router.use('/receituario', receituarioRoutes);

export { router as apiRoutes };
