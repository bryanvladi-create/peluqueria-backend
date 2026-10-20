import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getActiveTestimonials = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const getAllTestimonialsAdmin = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  const { client_name, review_text, rating } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO testimonials (client_name, review_text, rating, is_active) 
       VALUES ($1, $2, $3, true) RETURNING *`,
      [client_name, review_text, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const toggleTestimonialStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE testimonials SET is_active=$1 WHERE id=$2 RETURNING *',
      [is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
    res.json({ message: 'Testimonio eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};