import { Router } from 'express';
import { getPublicServices, getAllServicesAdmin, createService, updateService, deleteService, addServiceImages, deleteServiceImage } from '../controllers/services.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/public', getPublicServices);
router.get('/admin', verifyToken, getAllServicesAdmin);
router.post('/', verifyToken, createService);
router.post('/:id/images', verifyToken, upload.array('images', 10), addServiceImages);
router.delete('/images/:imageId', verifyToken, deleteServiceImage);
router.put('/:id', verifyToken, updateService);
router.delete('/:id', verifyToken, deleteService);

export default router;