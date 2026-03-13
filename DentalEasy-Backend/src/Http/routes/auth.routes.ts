import { Router } from 'express';
import { loginSchema } from '../../Application/DTOs';
import { container } from '../../container';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const data = await container.authUseCases.login(payload);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const data = await container.authUseCases.me(user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
