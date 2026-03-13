import { Router } from 'express';
import { createPacienteSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.get(
  '/',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.pacienteUseCases.listarPacientes(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createPacienteSchema.parse(req.body);
    const data = await container.pacienteUseCases.criarPaciente(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

export { router as pacienteRoutes };
