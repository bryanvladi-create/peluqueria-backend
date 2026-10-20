import multer from 'multer';

// Usamos memoryStorage para procesar el archivo en memoria antes de subirlo a Supabase
export const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB
});