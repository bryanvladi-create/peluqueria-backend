import { Router } from 'express';
import { getSettings, updateSettings, uploadHeroImage } from '../controllers/settings.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', getSettings);
router.post('/hero-image', verifyToken, upload.single('image'), uploadHeroImage);
router.put('/:id', verifyToken, updateSettings);

export default router;