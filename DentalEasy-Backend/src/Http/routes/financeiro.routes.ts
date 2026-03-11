import { Router } from 'express';
import { createPagamentoSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.get('/pagamentos', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const data = await container.financeiroUseCases.listarPagamentos(user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/pagamentos', async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createPagamentoSchema.parse(req.body);
    const data = await container.financeiroUseCases.criarPagamento(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

export { router as financeiroRoutes };
