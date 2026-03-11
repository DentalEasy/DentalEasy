import { Router } from 'express';
import { createReceitaSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.get('/receitas', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const data = await container.receituarioUseCases.listarReceitas(user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/receitas', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createReceitaSchema.parse(req.body);
    const data = await container.receituarioUseCases.criarReceita(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

export { router as receituarioRoutes };
