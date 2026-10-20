import dotenv from 'dotenv';
dotenv.config();

interface AppointmentData {
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_name?: string;
  notes?: string;
}

export const sendAppointmentNotifications = async (data: AppointmentData) => {
  
  // ==========================================
  // 1. ENVIAR CORREO ELECTRÓNICO (Vía Brevo API)
  // ==========================================
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY no está definida. No se enviarán correos.');
  } else {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Peluquería Web', email: process.env.SENDER_EMAIL },
          to: [{ email: process.env.ADMIN_EMAIL, name: 'Administrador' }],
          subject: `📅 Nueva Cita: ${data.client_name}`,
          htmlContent: `
            <h2>¡Tienes una nueva solicitud de cita!</h2>
            <p><strong>Cliente:</strong> ${data.client_name}</p>
            <p><strong>Teléfono:</strong> ${data.client_phone}</p>
            <p><strong>Fecha:</strong> ${data.appointment_date}</p>
            <p><strong>Hora:</strong> ${data.appointment_time}</p>
            <p><strong>Servicio:</strong> ${data.service_name || 'No especificado'}</p>
            <p><strong>Notas:</strong> ${data.notes || 'Ninguna'}</p>
          `,
        }),
      });

      if (response.ok) {
        console.log(`📧 Correo enviado vía Brevo a ${process.env.ADMIN_EMAIL}`);
      } else {
        const errorBody = await response.text();
        console.error('❌ Error de Brevo:', errorBody);
      }
    } catch (error) {
      console.error('❌ Error al enviar correo con Brevo:', error);
    }
  }

  // ==========================================
  // 2. ENVIAR WHATSAPP (Solo si está habilitado)
  // ==========================================
  if (process.env.ENABLE_WHATSAPP === 'true') {
    try {
      const waUrl = process.env.WHATSAPP_API_URL;
      const token = process.env.WHATSAPP_TOKEN;
      const to = process.env.WHATSAPP_ADMIN_NUMBER;

      if (!waUrl || !token || !to) {
        console.warn('⚠️ Faltan variables de WhatsApp.');
        return;
      }

      const message = `📅 *Nueva Cita*\nCliente: ${data.client_name}\nTeléfono: ${data.client_phone}\nFecha: ${data.appointment_date} a las ${data.appointment_time}\nServicio: ${data.service_name || 'N/A'}`;

      const response = await fetch(waUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          token: token, 
          to: to, 
          body: message 
        })
      });

      if (response.ok) {
        console.log('📱 WhatsApp de notificación enviado');
      } else {
        console.error('❌ Error al enviar WhatsApp:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error en la petición de WhatsApp:', error);
    }
  }
};