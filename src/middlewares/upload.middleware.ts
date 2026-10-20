import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { checkImageDimensions, destroyImages } from '../utils/helpers';

// Crear la carpeta 'uploads' en la raíz del backend si no existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Máximo 8 MB por imagen
export const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

/** Middleware para validar dimensiones. Puede forzar a que sea horizontal. */
export const validateImageSize = (requireLandscape = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const files: Express.Multer.File[] = [];
    if (req.file) files.push(req.file);
    if (req.files && Array.isArray(req.files)) files.push(...req.files);

    for (const file of files) {
      const isValid = await checkImageDimensions(file.path, requireLandscape);
      if (!isValid) {
        await destroyImages(files.map(f => f.filename));
        const msg = requireLandscape 
          ? 'La imagen de portada debe ser horizontal (más ancha que alta) y no superar 4000x4000 px.'
          : 'Una o más imágenes superan el límite de 4000x4000 píxeles.';
        return res.status(400).json({ message: msg });
      }
    }
    next();
  };
};