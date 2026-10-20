import { Request, Response } from 'express';
import { pool } from '../config/db';
import { destroyImages, emptyToNull, isUuid, parseBool } from '../utils/helpers';

const COLUMNS = 'id, title, subtitle, description, image_url, start_date, end_date, is_active, created_at';

// Público: solo promociones activas
export const getPublicPromotions = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM promotions WHERE is_active = true ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// Admin: todas las promociones
export const getAllPromotionsAdmin = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM promotions ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// POST multipart/form-data
export const createPromotion = async (req: Request, res: Response) => {
  const { title, subtitle, description, start_date, end_date, is_active } = req.body ?? {};
  if (!title || !String(title).trim()) {
    if (req.file) await destroyImages([req.file.filename]);
    return res.status(400).json({ message: 'El título de la promoción es obligatorio' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO promotions (title, subtitle, description, image_url, public_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${COLUMNS}`,
      [
        String(title).trim(), 
        emptyToNull(subtitle), 
        emptyToNull(description),
        req.file ? `/uploads/${req.file.filename}` : null, // 👈 Ruta relativa guardada
        req.file?.filename ?? null,
        emptyToNull(start_date), 
        emptyToNull(end_date), 
        parseBool(is_active, true)
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT (JSON o multipart): actualización parcial
export const updatePromotion = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Promoción no encontrada' });

  const body = req.body ?? {};
  const fields: string[] = [];
  const values: unknown[] = [];
  const set = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (body.title !== undefined) {
    if (!String(body.title).trim()) return res.status(400).json({ message: 'El título no puede quedar vacío' });
    set('title', String(body.title).trim());
  }
  if (body.subtitle !== undefined) set('subtitle', emptyToNull(body.subtitle));
  if (body.description !== undefined) set('description', emptyToNull(body.description));
  if (body.start_date !== undefined) set('start_date', emptyToNull(body.start_date));
  if (body.end_date !== undefined) set('end_date', emptyToNull(body.end_date));
  if (body.is_active !== undefined) set('is_active', parseBool(body.is_active));
  
  if (req.file) {
    set('image_url', `/uploads/${req.file.filename}`); // 👈 Ruta relativa guardada
    set('public_id', req.file.filename);
  }

  if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

  try {
    const previous = await pool.query('SELECT public_id FROM promotions WHERE id = $1', [id]);
    if (previous.rowCount === 0) {
      if (req.file) await destroyImages([req.file.filename]);
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE promotions SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`, values);
    if (req.file) await destroyImages([previous.rows[0].public_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
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
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};