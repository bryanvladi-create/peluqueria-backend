import { Request, Response } from 'express';
import { pool } from '../config/db';
import { destroyImages, emptyToNull, isUuid, uploadToSupabase, checkImageDimensions } from '../utils/helpers';

export const getGallery = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, image_url, alt_text, created_at FROM gallery ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const uploadImages = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return res.status(400).json({ message: 'No se subió ninguna imagen' });

  const altText = emptyToNull(req.body?.alt_text) ?? 'Galería Peluquería';
  try {
    const created = [];
    for (const file of files) {
      if (!checkImageDimensions(file.buffer)) {
        return res.status(400).json({ message: 'Una o más imágenes superan el límite de 4000x4000 px.' });
      }
      const uploaded = await uploadToSupabase(file, 'gallery');
      const result = await pool.query(
        `INSERT INTO gallery (image_url, public_id, alt_text) VALUES ($1, $2, $3) RETURNING id, image_url, alt_text, created_at`,
        [uploaded.url, uploaded.filename, altText]
      );
      created.push(result.rows[0]);
    }
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al subir imágenes' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Imagen no encontrada' });
  try {
    const result = await pool.query('DELETE FROM gallery WHERE id = $1 RETURNING public_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Imagen no encontrada' });
    await destroyImages([result.rows[0].public_id]);
    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno al eliminar' });
  }
};