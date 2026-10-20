// src/routes/auth.routes.ts
import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// Endpoint público para obtener el token (solo para el dueño)
router.post('/login', login);

export default router;