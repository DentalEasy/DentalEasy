import { Router } from 'express';
import { addDiagnosticoSchema, addTratamentoSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.post('/tratamentos', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = addTratamentoSchema.parse(req.body);
    const data = await container.prontuarioUseCases.adicionarTratamento(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/diagnosticos', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = addDiagnosticoSchema.parse(req.body);
    const data = await container.prontuarioUseCases.adicionarDiagnostico(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

export { router as prontuarioRoutes };
