import { Router } from 'express';
import {
  getPublicPromotions, getAllPromotionsAdmin, createPromotion, updatePromotion, deletePromotion
} from '../controllers/promotions.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/public', getPublicPromotions);
router.get('/admin', verifyToken, getAllPromotionsAdmin);
router.post('/', verifyToken, upload.single('image'), createPromotion);
router.put('/:id', verifyToken, upload.single('image'), updatePromotion);
router.delete('/:id', verifyToken, deletePromotion);

export default router;
