import path from 'path';
import sizeOf from 'image-size';
import { supabase, BUCKET_NAME } from '../config/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DIMENSION = 4000;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);

export const parseBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
};

export const emptyToNull = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' || text === 'null' ? null : text;
};

export const toStringList = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
};

/** Valida las dimensiones desde el Buffer en memoria */
export const checkImageDimensions = (buffer: Buffer, requireLandscape = false): boolean => {
  try {
    const dimensions = sizeOf(buffer);
    if (!dimensions || !dimensions.width || !dimensions.height) return false;
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) return false;
    if (requireLandscape && dimensions.height > dimensions.width) return false;
    return true;
  } catch {
    return false;
  }
};

/** Sube un archivo a Supabase Storage y devuelve la URL pública y el nombre */
export const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}/${uniqueSuffix}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(`Error subiendo a Supabase: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return {
    url: publicUrlData.publicUrl,
    filename: filename 
  };
};

/** Borra imágenes de Supabase Storage */
export const destroyImages = async (filenames: Array<string | null | undefined>): Promise<void> => {
  const validFilenames = filenames.filter((name): name is string => !!name);
  if (validFilenames.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(validFilenames);
  if (error) {
    console.error(`❌ Error al eliminar de Supabase:`, error.message);
  }
};