import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DATE -> string 'YYYY-MM-DD' (evita que un Date con zona horaria corra el día)
types.setTypeParser(1082, (value: string) => value);
// NUMERIC -> number (p. ej. google_rating 4.8 en vez de "4.8")
types.setTypeParser(1700, (value: string) => parseFloat(value));

const pool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        // SSL es OBLIGATORIO para conectarse a Supabase en la nube
        ssl: { rejectUnauthorized: false } 
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
      }
);

// Prueba de conexión
pool.query('SELECT 1')
  .then(() => console.log(`✅ Conectado a PostgreSQL (Supabase/Local)`))
  .catch((err) => console.error('❌ Error conectando a PostgreSQL:', err));

export { pool };