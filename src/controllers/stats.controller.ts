import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FILTER (WHERE is_active)     FROM services)::int      AS services_active,
        (SELECT COUNT(*) FILTER (WHERE NOT is_active) FROM services)::int      AS services_inactive,
        (SELECT COUNT(*)                              FROM gallery)::int       AS gallery_total,
        (SELECT COUNT(*) FILTER (WHERE is_active)     FROM promotions)::int    AS promotions_active,
        (SELECT COUNT(*) FILTER (WHERE NOT is_active) FROM promotions)::int    AS promotions_inactive,
        (SELECT COUNT(*) FILTER (WHERE is_active)     FROM testimonials)::int  AS testimonials_active,
        (SELECT COUNT(*) FILTER (WHERE status = 'pending') FROM appointments)::int AS appointments_pending,
        (SELECT show_testimonials FROM site_settings LIMIT 1)                  AS testimonials_section_on
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};