import { Router } from 'express';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
  settlePaymentSchema,
  updatePaymentSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const query = listPaymentsQuerySchema.parse(req.query);
    const data = await container.paymentsApiUseCases.listPayments(user, query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const { id } = idParamSchema.parse(req.params);
    const data = await container.paymentsApiUseCases.getPaymentById(user, id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createPaymentSchema.parse(req.body);
    const data = await container.paymentsApiUseCases.createPayment(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/settle',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = settlePaymentSchema.parse(req.body);
      const data = await container.paymentsApiUseCases.settlePayment(
        user,
        id,
        payload,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updatePaymentSchema.parse(req.body);
      const data = await container.paymentsApiUseCases.updatePayment(user, id, payload);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id/receipt',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data = await container.paymentsApiUseCases.getPaymentReceipt(user, id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as paymentsRoutes };
