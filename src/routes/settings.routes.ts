import { Router } from 'express';
import { getSettings, updateSettings, uploadHeroImage } from '../controllers/settings.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload, validateImageSize } from '../middlewares/upload.middleware';

const router = Router();

// Ruta pública (El frontend la consume al cargar)
router.get('/', getSettings);

// Rutas privadas (Solo el admin con token puede actualizar)
// 👇 Aquí aplicamos validateImageSize(true) para exigir que sea horizontal
router.post('/hero-image', verifyToken, upload.single('image'), validateImageSize(true), uploadHeroImage);
router.put('/:id', verifyToken, updateSettings);

export default router;