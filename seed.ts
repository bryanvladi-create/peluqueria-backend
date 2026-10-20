// seed.ts — `npm run seed`
// 1) Aplica database/schema.sql (idempotente)  2) Crea el administrador  3) Crea la configuración inicial
// Variables: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, SEED_DEMO (ver .env.example)
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from './src/config/db';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';
  if (!email || !password) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en tu .env antes de ejecutar el seed.');
  }

  // 1) Esquema
  const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✔ Esquema aplicado');

  // 2) Administrador
  const hash = await bcrypt.hash(password, 12);
  const admin = await pool.query(
    `INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [username, email, hash]
  );
  console.log(admin.rowCount ? `✔ Administrador creado: ${email}` : `• El administrador ${email} ya existía (no se modificó)`);

  // 3) Configuración inicial (plantilla con placeholders)
  const settings = await pool.query('SELECT 1 FROM site_settings LIMIT 1');
  if (settings.rowCount === 0) {
    await pool.query(
      `INSERT INTO site_settings
         (business_name, whatsapp_number, city, address_text, opening_hours,
          hero_eyebrow, hero_title, hero_subtitle, show_testimonials)
       VALUES ('[Nombre del Negocio]', '+593000000000', '[Ciudad]', '[Dirección del local]',
               'Lunes a Sábado 09:00 - 19:00',
               'Tu estilo, nuestra pasión', 'Realza tu belleza, confía en expertos',
               'Cuidamos de tu cabello con técnicas modernas, productos de alta calidad y un trato personalizado.',
               true)`
    );
    console.log('✔ Configuración inicial creada');
  } else {
    console.log('• La configuración ya existía (no se modificó)');
  }

  // 4) Contenido de ejemplo (opcional)
  if (process.env.SEED_DEMO === 'true') {
    const has = await pool.query('SELECT 1 FROM services LIMIT 1');
    if (has.rowCount === 0) {
      const demo = [
        ['Cambio de Look', 'Un nuevo estilo, una nueva tú.', 'Transformamos tu imagen con un corte y color pensados para ti.', ['Asesoría de imagen', 'Productos profesionales', 'Resultado personalizado']],
        ['Expertos en Color', 'Color que realza tu esencia.', 'Tonos que realzan tu esencia, con técnicas que cuidan la fibra capilar.', ['Color de larga duración', 'Cabello más brillante y saludable', 'Asesoría personalizada', 'Productos profesionales']],
        ['Corte', 'Estilo y precisión.', 'Cortes modernos y clásicos adaptados a la forma de tu rostro.', ['Corte a medida', 'Lavado y secado incluidos']],
        ['Tratamientos Capilares', 'Cabello sano y fuerte.', 'Hidratación, reparación y nutrición profunda para devolver vida a tu cabello.', ['Diagnóstico capilar', 'Reparación profunda', 'Brillo y suavidad']],
      ];
      for (const [name, short, detailed, benefits] of demo) {
        await pool.query(
          'INSERT INTO services (name, short_description, detailed_description, benefits) VALUES ($1,$2,$3,$4)',
          [name, short, detailed, benefits]
        );
      }
      await pool.query(
        `INSERT INTO promotions (title, subtitle, description, end_date)
         VALUES ('Promoción Especial', 'Color + Corte', 'Luce increíble por tiempo limitado.', CURRENT_DATE + 30)`
      );
      await pool.query(
        `INSERT INTO testimonials (client_name, review_text, rating) VALUES
         ('María Fernanda', 'Excelente servicio, el personal es muy profesional y el resultado superó mis expectativas.', 5),
         ('Daniela López', 'Me encantó el cambio de look, quedé exactamente como quería. Sin duda volveré.', 5),
         ('Carla Ruiz', 'Siempre salgo feliz de aquí, son los mejores en la ciudad.', 5)`
      );
      console.log('✔ Contenido de ejemplo insertado');
    }
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ Seed falló:', err.message);
    pool.end().finally(() => process.exit(1));
  });
