import { Router } from 'express';
import { agendamentoRoutes } from './agendamento.routes';
import { appointmentsRoutes } from './appointments.routes';
import { dashboardRoutes } from './dashboard.routes';
import { financialRecordsRoutes } from './financial-records.routes';
import { financeiroRoutes } from './financeiro.routes';
import { inventoryRoutes } from './inventory.routes';
import { medicalRecordsRoutes } from './medical-records.routes';
import { notificationsRoutes } from './notifications.routes';
import { pacienteRoutes } from './paciente.routes';
import { patientsRoutes } from './patients.routes';
import { paymentsRoutes } from './payments.routes';
import { prescriptionsRoutes } from './prescriptions.routes';
import { prontuarioRoutes } from './prontuario.routes';
import { proceduresRoutes } from './procedures.routes';
import { receituarioRoutes } from './receituario.routes';
import { reportsRoutes } from './reports.routes';
import { settingsRoutes } from './settings.routes';
import { treatmentPlansRoutes } from './treatment-plans.routes';
import { usersRoutes } from './users.routes';

const router = Router();

router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/medical-records', medicalRecordsRoutes);
router.use('/prescriptions', prescriptionsRoutes);
router.use('/financial-records', financialRecordsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/users', usersRoutes);
router.use('/procedures', proceduresRoutes);
router.use('/treatment-plans', treatmentPlansRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

router.use('/pacientes', pacienteRoutes);
router.use('/agendamento', agendamentoRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/prontuario', prontuarioRoutes);
router.use('/receituario', receituarioRoutes);

export { router as apiRoutes };
