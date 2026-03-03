-- Postgres schema (portable baseline)
-- NOTE: Prisma can manage schema. This SQL is for direct DB creation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE kpi_status AS ENUM ('OK','VIG','CRIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS model_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  weight numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_version_id, code)
);

CREATE TABLE IF NOT EXISTS segment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  alpha numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_version_id, code)
);

CREATE TABLE IF NOT EXISTS zone (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  beta numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_version_id, code)
);

CREATE TABLE IF NOT EXISTS kpi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  unit text,
  weight numeric NOT NULL DEFAULT 1,
  direction text NOT NULL DEFAULT 'higher_is_better',
  source_hint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_version_id, code)
);

CREATE TABLE IF NOT EXISTS kpi_threshold (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES kpi(id) ON DELETE CASCADE,
  status kpi_status NOT NULL,
  min_value numeric,
  max_value numeric,
  segment_code text,
  zone_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_kpi_threshold_kpi_status ON kpi_threshold(kpi_id, status);

CREATE TABLE IF NOT EXISTS trigger_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  malus numeric NOT NULL DEFAULT 0,
  is_hard_trigger boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_version_id, code)
);

CREATE TABLE IF NOT EXISTS project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_ref text UNIQUE NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  zone_code text NOT NULL,
  segment_code text NOT NULL,
  promoter_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  model_version_id uuid NOT NULL REFERENCES model_version(id) ON DELETE RESTRICT,
  date_scoring timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'DRAFT',
  inputs jsonb NOT NULL,
  results jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eval_project_date ON evaluation(project_id, date_scoring);
