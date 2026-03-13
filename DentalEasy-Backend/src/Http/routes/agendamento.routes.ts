import { Router } from 'express';
import { createConsultaSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.get(
  '/consultas',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.agendamentoUseCases.listarConsultas(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/consultas',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = createConsultaSchema.parse(req.body);
      const data = await container.agendamentoUseCases.criarConsulta(user, payload);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as agendamentoRoutes };
