import { Request, Response } from 'express';
import { pool } from '../config/db';
import { destroyImages, emptyToNull, isUuid, parseBool, uploadToSupabase, checkImageDimensions } from '../utils/helpers';

const PUBLIC_COLUMNS = `id, business_name, whatsapp_number, facebook_url, instagram_url, tiktok_url,
  address_text, map_embed_url, show_testimonials, city, opening_hours, google_maps_url,
  google_rating, google_reviews_count, hero_eyebrow, hero_title, hero_subtitle, hero_image_url, hero_image_position, updated_at`;

const TEXT_FIELDS = [
  'whatsapp_number', 'facebook_url', 'instagram_url', 'tiktok_url', 'address_text', 'map_embed_url',
  'city', 'opening_hours', 'google_maps_url', 'hero_eyebrow', 'hero_title', 'hero_subtitle', 'hero_image_position'
];

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM site_settings LIMIT 1`);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Configuración no encontrada' });
    res.json(result.rows[0]);
  } catch { res.status(500).json({ message: 'Error interno' }); }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Configuración no encontrada' });

  const body = req.body ?? {};
  const fields: string[] = [];
  const values: unknown[] = [];
  const set = (column: string, value: unknown) => { values.push(value); fields.push(`${column} = $${values.length}`); };

  if (body.business_name !== undefined) {
    const name = emptyToNull(body.business_name);
    if (!name) return res.status(400).json({ message: 'El nombre del negocio es obligatorio' });
    set('business_name', name);
  }
  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined) set(field, emptyToNull(body[field]));
  }
  if (body.show_testimonials !== undefined) set('show_testimonials', parseBool(body.show_testimonials, true));

  if (body.google_rating !== undefined) {
    const rating = emptyToNull(body.google_rating);
    const value = rating === null ? null : Number(rating);
    if (value !== null && !(value >= 0 && value <= 5)) return res.status(400).json({ message: 'La calificación debe estar entre 0 y 5' });
    set('google_rating', value);
  }
  if (body.google_reviews_count !== undefined) {
    const count = emptyToNull(body.google_reviews_count);
    const value = count === null ? null : Math.trunc(Number(count));
    if (value !== null && !(value >= 0)) return res.status(400).json({ message: 'El número de reseñas no es válido' });
    set('google_reviews_count', value);
  }

  if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

  try {
    values.push(id);
    const result = await pool.query(
      `UPDATE site_settings SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Configuración no encontrada' });
    res.json({ message: 'Configuración actualizada', settings: result.rows[0] });
  } catch { res.status(500).json({ message: 'Error interno del servidor' }); }
};

export const uploadHeroImage = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });
  try {
    if (!checkImageDimensions(req.file.buffer, true)) {
      return res.status(400).json({ message: 'La imagen de portada debe ser horizontal (más ancha que alta) y no superar 4000x4000 px.' });
    }

    const previous = await pool.query('SELECT id, hero_image_public_id FROM site_settings LIMIT 1');
    if (previous.rowCount === 0) return res.status(404).json({ message: 'Configuración no encontrada' });

    const uploaded = await uploadToSupabase(req.file, 'hero');
    const result = await pool.query(
      `UPDATE site_settings SET hero_image_url = $1, hero_image_public_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING ${PUBLIC_COLUMNS}`,
      [uploaded.url, uploaded.filename, previous.rows[0].id]
    );
    await destroyImages([previous.rows[0].hero_image_public_id]);
    res.json({ message: 'Imagen de portada actualizada', settings: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};