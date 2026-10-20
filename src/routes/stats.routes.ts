import { Router } from 'express';
import { getStats } from '../controllers/stats.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, getStats);

export default router;
