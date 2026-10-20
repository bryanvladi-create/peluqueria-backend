# peluqueria-backend

API Node.js + Express + PostgreSQL (JWT solo para el administrador, imágenes en Cloudinary).

## Puesta en marcha
1. `npm install`
2. Copia `.env.example` a `.env` y complétalo (DB, `JWT_SECRET`, Cloudinary y `ADMIN_*`).
   - ¿Sin PostgreSQL instalado? `docker compose up -d` levanta uno que ya coincide con `.env.example`.
3. `npm run seed` — aplica `database/schema.sql`, crea el administrador y la configuración inicial.
   Con `SEED_DEMO=true` añade servicios, promoción y testimonios de ejemplo. Se puede repetir sin duplicar datos.
4. `npm run dev` — API en `http://localhost:4000`.

Sin credenciales de Cloudinary todo funciona **excepto subir fotos**.

## Endpoints
| Público | Admin (Bearer token) |
|---|---|
| `GET /api/settings` | `PUT /api/settings/:id`, `POST /api/settings/hero-image` |
| `GET /api/services/public` | `GET /api/services/admin`, `POST/PUT/DELETE /api/services[/:id]`, `POST /api/services/:id/images`, `DELETE /api/services/images/:imageId` |
| `GET /api/gallery` | `POST /api/gallery` (campo `images`), `DELETE /api/gallery/:id` |
| `GET /api/promotions/public` | `GET /api/promotions/admin`, `POST/PUT/DELETE /api/promotions[/:id]` |
| `GET /api/testimonials/public` | `GET /api/testimonials/admin`, `POST`, `PUT /:id/toggle`, `DELETE /:id` |
| `POST /api/auth/login` | `GET /api/stats` |
