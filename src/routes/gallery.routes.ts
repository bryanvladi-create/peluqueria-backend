import { Router } from 'express';
import { getGallery, uploadImages, deleteImage } from '../controllers/gallery.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', getGallery); // Público
// Ruta protegida: subida de varias imágenes con nombre de campo 'images'
router.post('/', verifyToken, upload.array('images', 20), uploadImages);
router.delete('/:id', verifyToken, deleteImage);

export default router;
