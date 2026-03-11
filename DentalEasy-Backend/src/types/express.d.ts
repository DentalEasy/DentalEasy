import { UserContext } from '../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

export {};
