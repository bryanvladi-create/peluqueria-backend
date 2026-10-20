import dotenv from 'dotenv';
dotenv.config();

interface AppointmentData {
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  appointment_date: string;
  appointment_time: string;
  service_name?: string;
  notes?: string;
}

// 1. Notificar al ADMIN (Nueva cita)
export const sendAdminNotification = async (data: AppointmentData) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Peluquería Web', email: process.env.SENDER_EMAIL },
        to: [{ email: process.env.ADMIN_EMAIL, name: 'Administrador' }],
        subject: `📅 Nueva Cita: ${data.client_name}`,
        htmlContent: `
          <h2>¡Tienes una nueva solicitud de cita!</h2>
          <p><strong>Cliente:</strong> ${data.client_name}</p>
          <p><strong>Teléfono:</strong> ${data.client_phone}</p>
          <p><strong>Fecha:</strong> ${data.appointment_date} a las ${data.appointment_time}</p>
          <p><strong>Servicio:</strong> ${data.service_name || 'No especificado'}</p>
        `,
      }),
    });
    console.log(`📧 Correo enviado al ADMIN`);
  } catch (error) { console.error('❌ Error Brevo Admin:', error); }
};

// 2. Notificar al CLIENTE (Confirmación o Cancelación)
export const sendClientNotification = async (data: AppointmentData, status: 'confirmed' | 'cancelled', reason?: string) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !data.client_email) return;

  const isConfirmed = status === 'confirmed';
  const subject = isConfirmed ? '✅ Tu cita ha sido confirmada' : '❌ Tu cita ha sido cancelada';
  
  const htmlContent = isConfirmed 
    ? `<h2>¡Hola ${data.client_name}!</h2>
       <p>Tu cita para el servicio <strong>${data.service_name}</strong> ha sido <strong>CONFIRMADA</strong>.</p>
       <p>Te esperamos el día <strong>${data.appointment_date}</strong> a las <strong>${data.appointment_time}</strong>.</p>
       <p>¡Gracias por elegirnos!</p>`
    : `<h2>Hola ${data.client_name}</h2>
       <p>Lamentamos informarte que tu cita para el día <strong>${data.appointment_date}</strong> ha sido cancelada.</p>
       ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
       <p>Por favor, ponte en contacto con nosotros para reprogramar.</p>`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Peluquería Web', email: process.env.SENDER_EMAIL },
        to: [{ email: data.client_email, name: data.client_name }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });
    console.log(`📧 Correo enviado al CLIENTE (${data.client_email})`);
  } catch (error) { console.error('❌ Error Brevo Cliente:', error); }
};