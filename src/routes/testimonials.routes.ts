import { Router } from 'express';
import { 
  getActiveTestimonials, getAllTestimonialsAdmin, createTestimonial, toggleTestimonialStatus, deleteTestimonial 
} from '../controllers/testimonials.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public', getActiveTestimonials);
router.get('/admin', verifyToken, getAllTestimonialsAdmin);
router.post('/', verifyToken, createTestimonial);
router.put('/:id/toggle', verifyToken, toggleTestimonialStatus);
router.delete('/:id', verifyToken, deleteTestimonial);

export default router;