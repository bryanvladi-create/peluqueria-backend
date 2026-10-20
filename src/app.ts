import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth.routes';
import settingsRoutes from './routes/settings.routes';
import servicesRoutes from './routes/services.routes';
import galleryRoutes from './routes/gallery.routes';
import promotionsRoutes from './routes/promotions.routes';
import testimonialsRoutes from './routes/testimonials.routes';
import statsRoutes from './routes/stats.routes';
import appointmentsRoutes from './routes/appointments.routes';

const app = express();

// 1. Desactivar ETags (evita que el navegador valide si el archivo cambió)
app.set('etag', false);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// 2. PROHIBIR EL CACHÉ EN LAS RUTAS DE LA API
app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Servir las imágenes locales públicamente en /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rutas
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/stats', statsRoutes);


// Errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'La imagen supera el máximo de 8 MB' });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ message: 'No se pudo procesar el archivo subido' });
  }
  res.status(err?.status ?? 500).json({ message: err?.message ?? 'Error interno del servidor' });
});

export default app;