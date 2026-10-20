import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true para puerto 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface AppointmentData {
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_name?: string;
  notes?: string;
}

export const sendAppointmentNotifications = async (data: AppointmentData) => {
  // 1. Enviar Correo Electrónico
  try {
    const mailOptions = {
      from: `"Peluquería Web" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📅 Nueva Cita: ${data.client_name}`,
      html: `
        <h2>¡Tienes una nueva solicitud de cita!</h2>
        <p><strong>Cliente:</strong> ${data.client_name}</p>
        <p><strong>Teléfono:</strong> ${data.client_phone}</p>
        <p><strong>Fecha:</strong> ${data.appointment_date}</p>
        <p><strong>Hora:</strong> ${data.appointment_time}</p>
        <p><strong>Servicio:</strong> ${data.service_name || 'No especificado'}</p>
        <p><strong>Notas:</strong> ${data.notes || 'Ninguna'}</p>
        <br>
        <p>Ingresa a tu panel de administración para confirmar o cancelar esta cita.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`📧 Correo de notificación enviado a ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
  }

  // 2. Enviar WhatsApp (Solo si ENABLE_WHATSAPP es true en el .env)
  if (process.env.ENABLE_WHATSAPP === 'true') {
    try {
      const waUrl = process.env.WHATSAPP_API_URL;
      const token = process.env.WHATSAPP_TOKEN;
      const to = process.env.WHATSAPP_ADMIN_NUMBER;

      const message = `📅 *Nueva Cita*\nCliente: ${data.client_name}\nTeléfono: ${data.client_phone}\nFecha: ${data.appointment_date} a las ${data.appointment_time}\nServicio: ${data.service_name || 'N/A'}`;

      const response = await fetch(waUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          token: token as string, 
          to: to as string, 
          body: message 
        })
      });

      if (response.ok) console.log('📱 WhatsApp de notificación enviado');
      else console.error('❌ Error al enviar WhatsApp:', await response.text());
    } catch (error) {
      console.error('❌ Error en la petición de WhatsApp:', error);
    }
  }
};