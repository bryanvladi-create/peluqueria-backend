import { Router } from 'express';
import { createAppointment, getAllAppointments, updateAppointmentStatus, deleteAppointment } from '../controllers/appointments.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Ruta PÚBLICA (Cualquier cliente puede agendar)
router.post('/', createAppointment);

// Rutas PRIVADAS (Solo el admin con token puede ver y gestionar)
router.get('/', verifyToken, getAllAppointments);
router.put('/:id/status', verifyToken, updateAppointmentStatus);
router.delete('/:id', verifyToken, deleteAppointment);

export default router;