-- ============================================================
-- peluqueria-backend · database/schema.sql
-- Esquema idempotente: se puede ejecutar varias veces sin romper datos.
-- Requiere PostgreSQL 13+ (usa gen_random_uuid()).
-- ============================================================

-- Administrador (único usuario del sistema; no hay login de clientes)
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(80)  NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Configuración global del sitio (una sola fila)
CREATE TABLE IF NOT EXISTS site_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name     VARCHAR(160) NOT NULL DEFAULT '[Nombre del Negocio]',
  whatsapp_number   VARCHAR(30),
  facebook_url      TEXT,
  instagram_url     TEXT,
  tiktok_url        TEXT,
  address_text      TEXT,
  map_embed_url     TEXT,
  show_testimonials BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS city                 VARCHAR(120);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS opening_hours        TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_maps_url      TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_rating        NUMERIC(2,1);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_eyebrow         VARCHAR(160);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_title           VARCHAR(220);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subtitle        TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_url       TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_public_id TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_position VARCHAR(50) DEFAULT 'center';

-- Servicios (tarjeta + ventana flotante)
CREATE TABLE IF NOT EXISTS services (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(160) NOT NULL,
  short_description    TEXT,
  detailed_description TEXT,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE services ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}';

-- Fotos específicas de cada servicio (la primera hace de portada de la tarjeta)
CREATE TABLE IF NOT EXISTS service_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url  TEXT        NOT NULL,
  public_id  TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_images_service ON service_images (service_id, sort_order);

-- Galería general
CREATE TABLE IF NOT EXISTS gallery (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT        NOT NULL,
  public_id  TEXT,
  alt_text   VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Promociones temporales (se ocultan con is_active = false sin borrarse)
CREATE TABLE IF NOT EXISTS promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(160) NOT NULL,
  description TEXT,
  image_url   TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS subtitle  VARCHAR(160);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS public_id TEXT;

-- Testimonios (reseñas cargadas a mano o copiadas de Google Maps)
CREATE TABLE IF NOT EXISTS testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(120) NOT NULL,
  review_text TEXT         NOT NULL,
  rating      SMALLINT     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
