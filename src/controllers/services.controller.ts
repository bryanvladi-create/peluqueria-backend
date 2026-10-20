import { Request, Response } from 'express';
import { pool } from '../config/db';
import { destroyImages, isUuid, parseBool, toStringList } from '../utils/helpers';

const SERVICE_SELECT = `
  SELECT s.id, s.name, s.short_description, s.detailed_description, s.benefits,
         s.is_active, s.created_at, s.updated_at,
         COALESCE(
           (SELECT json_agg(json_build_object('id', i.id, 'image_url', i.image_url)
                            ORDER BY i.sort_order, i.created_at)
              FROM service_images i WHERE i.service_id = s.id),
           '[]'::json
         ) AS images,
         (SELECT i.image_url FROM service_images i
            WHERE i.service_id = s.id ORDER BY i.sort_order, i.created_at LIMIT 1) AS cover_image_url
    FROM services s`;

const findOne = async (id: string) => {
  const result = await pool.query(`${SERVICE_SELECT} WHERE s.id = $1`, [id]);
  return result.rows[0];
};

export const getPublicServices = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`${SERVICE_SELECT} WHERE s.is_active = true ORDER BY s.created_at ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const getAllServicesAdmin = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`${SERVICE_SELECT} ORDER BY s.created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const createService = async (req: Request, res: Response) => {
  const { name, short_description, detailed_description, benefits, is_active } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'El nombre del servicio es obligatorio' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO services (name, short_description, detailed_description, benefits, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [String(name).trim(), short_description ?? null, detailed_description ?? null,
       toStringList(benefits), parseBool(is_active, true)]
    );
    res.status(201).json(await findOne(result.rows[0].id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Servicio no encontrado' });

  const body = req.body ?? {};
  const fields: string[] = [];
  const values: unknown[] = [];
  const set = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (body.name !== undefined) {
    if (!String(body.name).trim()) return res.status(400).json({ message: 'El nombre no puede quedar vacío' });
    set('name', String(body.name).trim());
  }
  if (body.short_description !== undefined) set('short_description', body.short_description);
  if (body.detailed_description !== undefined) set('detailed_description', body.detailed_description);
  if (body.benefits !== undefined) set('benefits', toStringList(body.benefits));
  if (body.is_active !== undefined) set('is_active', parseBool(body.is_active));

  if (fields.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

  try {
    values.push(id);
    const result = await pool.query(
      `UPDATE services SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING id`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Servicio no encontrado' });
    res.json(await findOne(id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Servicio no encontrado' });
  try {
    const images = await pool.query('SELECT public_id FROM service_images WHERE service_id = $1', [id]);
    const result = await pool.query('DELETE FROM services WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Servicio no encontrado' });
    await destroyImages(images.rows.map((row) => row.public_id));
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const addServiceImages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  try {
    const exists = isUuid(id) && (await pool.query('SELECT 1 FROM services WHERE id = $1', [id])).rowCount;
    if (!exists) {
      await destroyImages(files.map((file) => file.filename)); // Limpieza local
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    if (files.length === 0) return res.status(400).json({ message: 'No se subió ninguna imagen' });

    const last = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS max FROM service_images WHERE service_id = $1', [id]);
    let order = Number(last.rows[0].max) + 1;

    for (const file of files) {
      await pool.query(
        'INSERT INTO service_images (service_id, image_url, public_id, sort_order) VALUES ($1, $2, $3, $4)',
        [id, `/uploads/${file.filename}`, file.filename, order++] // 👈 Ruta relativa guardada
      );
    }
    res.status(201).json(await findOne(id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir imágenes' });
  }
};

export const deleteServiceImage = async (req: Request, res: Response) => {
  const { imageId } = req.params;
  if (!isUuid(imageId)) return res.status(404).json({ message: 'Imagen no encontrada' });
  try {
    const result = await pool.query(
      'DELETE FROM service_images WHERE id = $1 RETURNING public_id, service_id', [imageId]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Imagen no encontrada' });
    await destroyImages([result.rows[0].public_id]);
    res.json(await findOne(result.rows[0].service_id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};