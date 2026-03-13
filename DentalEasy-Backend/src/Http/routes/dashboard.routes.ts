import { Router } from 'express';
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
      const data = await container.dashboardApiUseCases.getDashboard(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as dashboardRoutes };
