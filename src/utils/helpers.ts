import fs from 'fs/promises';
import path from 'path';
import sizeOf from 'image-size';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DIMENSION = 4000; // Límite de píxeles para las imágenes

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);

/** Acepta booleanos reales (JSON) y 'true'/'false' (multipart/form-data). */
export const parseBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
};

/** '' / undefined / 'null' -> null; el resto, texto recortado. */
export const emptyToNull = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' || text === 'null' ? null : text;
};

/** Lista de textos no vacíos. Acepta array o texto con saltos de línea. */
export const toStringList = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
};

/** Borra imágenes locales sin romper la petición si alguna falla o no existe. */
export const destroyImages = async (filenames: Array<string | null | undefined>): Promise<void> => {
  const validFilenames = filenames.filter((name): name is string => !!name);
  const uploadDir = path.join(process.cwd(), 'uploads');

  await Promise.allSettled(
    validFilenames.map(async (filename) => {
      try {
        const safeFilename = path.basename(filename);
        const filePath = path.join(uploadDir, safeFilename);
        await fs.unlink(filePath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`❌ Error al eliminar archivo local ${filename}:`, error.message);
        }
      }
    })
  );
};

/** Revisa si el archivo local supera las dimensiones permitidas o si debe ser horizontal. */
export const checkImageDimensions = async (filePath: string, requireLandscape = false): Promise<boolean> => {
  try {
    const buffer = await fs.readFile(filePath);
    
    // 👇 AQUÍ ESTÁ LA CORRECCIÓN (llamada directa a la función)
    const dimensions = sizeOf(buffer);
    
    if (!dimensions || !dimensions.width || !dimensions.height) return false;
    
    // 1. Validar tamaño máximo absoluto
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) return false;
    
    // 2. Validar que sea horizontal si es requerido (ej. para el Hero)
    if (requireLandscape && dimensions.height > dimensions.width) return false;

    return true;
  } catch {
    return false;
  }
};