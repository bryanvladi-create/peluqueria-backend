import { Request, Response } from 'express';
import { pool } from '../config/db';
import { emptyToNull, isUuid } from '../utils/helpers';

// Público: Crear una nueva cita
export const createAppointment = async (req: Request, res: Response) => {
  const { client_name, client_phone, client_email, service_id, appointment_date, appointment_time, notes } = req.body;

  if (!client_name || !client_phone || !appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'Nombre, teléfono, fecha y hora son obligatorios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (client_name, client_phone, client_email, service_id, appointment_date, appointment_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        String(client_name).trim(),
        String(client_phone).trim(),
        emptyToNull(client_email),
        service_id && isUuid(service_id) ? service_id : null,
        appointment_date,
        appointment_time,
        emptyToNull(notes)
      ]
    );
    res.status(201).json({ message: 'Cita agendada correctamente', appointment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno al agendar la cita' });
  }
};

// Admin: Ver todas las citas
export const getAllAppointments = async (_req: Request, res: Response) => {
  try {
    // Hacemos un JOIN para traer el nombre del servicio si es que tiene uno asignado
    const result = await pool.query(`
      SELECT a.*, s.name as service_name 
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno al obtener las citas' });
  }
};

// Admin: Actualizar estado (pendiente, confirmada, cancelada, completada)
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isUuid(id)) return res.status(404).json({ message: 'Cita no encontrada' });
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Cita no encontrada' });
    
    res.json({ message: 'Estado actualizado', appointment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// Admin: Eliminar una cita
export const deleteAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ message: 'Cita no encontrada' });

  try {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Cita no encontrada' });
    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};