import { Router } from 'express';
import {
  createPrescriptionSchema,
  exportPrescriptionQuerySchema,
  listPrescriptionsQuerySchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', authorizeRoles(['ADMIN', 'DENTIST']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const query = listPrescriptionsQuerySchema.parse(req.query);
    const data = await container.prescriptionsApiUseCases.listPrescriptions(
      user,
      query,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeRoles(['ADMIN', 'DENTIST']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createPrescriptionSchema.parse(req.body);
    const data = await container.prescriptionsApiUseCases.createPrescription(
      user,
      payload,
    );
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/:id/export',
  authorizeRoles(['ADMIN', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      exportPrescriptionQuerySchema.parse(req.query);
      const file = await container.prescriptionsApiUseCases.exportPrescriptionDocx(
        user,
        id,
      );

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.send(file.buffer);
    } catch (error) {
      next(error);
    }
  },
);

export { router as prescriptionsRoutes };
