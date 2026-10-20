import { Request, Response } from 'express';
import { pool } from '../config/db';
import { destroyImages, emptyToNull, isUuid, parseBool, uploadToSupabase, checkImageDimensions } from '../utils/helpers';

const COLUMNS = 'id, title, subtitle, description, image_url, start_date, end_date, is_active, created_at';

export const getPublicPromotions = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM promotions WHERE is_active = true ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const getAllPromotionsAdmin = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM promotions ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const createPromotion = async (req: Request, res: Response) => {
  const { title, subtitle, description, start_date, end_date, is_active } = req.body ?? {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'El título de la promoción es obligatorio' });
  }
  try {
    let image_url = null;
    let public_id = null;

    if (req.file) {
      if (!checkImageDimensions(req.file.buffer)) {
        return res.status(400).json({ message: 'La imagen supera los 4000x4000 px.' });
      }
      const uploaded = await uploadToSupabase(req.file, 'promotions');
      image_url = uploaded.url;
      public_id = uploaded.filename;
    }

    const result = await pool.query(
      `INSERT INTO promotions (title, subtitle, description, image_url, public_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${COLUMNS}`,
      [String(title).trim(), emptyToNull(subtitle), emptyToNull(description), image_url, public_id, emptyToNull(start_date), emptyToNull(end_date), parseBool(is_active, true)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};

export const updatePromotion = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Promoción no encontrada' });

  const body = req.body ?? {};
  const fields: string[] = [];
  const values: unknown[] = [];
  const set = (column: string, value: unknown) => { values.push(value); fields.push(`${column} = $${values.length}`); };

  if (body.title !== undefined) set('title', String(body.title).trim());
  if (body.subtitle !== undefined) set('subtitle', emptyToNull(body.subtitle));
  if (body.description !== undefined) set('description', emptyToNull(body.description));
  if (body.start_date !== undefined) set('start_date', emptyToNull(body.start_date));
  if (body.end_date !== undefined) set('end_date', emptyToNull(body.end_date));
  if (body.is_active !== undefined) set('is_active', parseBool(body.is_active));

  try {
    const previous = await pool.query('SELECT public_id FROM promotions WHERE id = $1', [id]);
    if (previous.rowCount === 0) return res.status(404).json({ message: 'Promoción no encontrada' });

    if (req.file) {
      if (!checkImageDimensions(req.file.buffer)) return res.status(400).json({ message: 'Imagen muy grande.' });
      const uploaded = await uploadToSupabase(req.file, 'promotions');
      set('image_url', uploaded.url);
      set('public_id', uploaded.filename);
      await destroyImages([previous.rows[0].public_id]);
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });
    values.push(id);
    const result = await pool.query(`UPDATE promotions SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`, values);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};

export const deletePromotion = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Promoción no encontrada' });
  try {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1 RETURNING public_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Promoción no encontrada' });
    await destroyImages([result.rows[0].public_id]);
    res.json({ message: 'Promoción eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};