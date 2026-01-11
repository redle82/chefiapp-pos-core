-- Supabase Migration: Legal Profiles & Compliance

-- Country Legal Profiles (optional cache; profiles also live as JSON)
CREATE TABLE IF NOT EXISTS legal_profiles (
  iso CHAR(2) PRIMARY KEY,
  country VARCHAR NOT NULL,
  languages JSONB NOT NULL,
  currency CHAR(3) NOT NULL,
  labor_laws JSONB NOT NULL,
  data_protection JSONB NOT NULL,
  hygiene_regulations JSONB NOT NULL,
  penalties JSONB
);

-- Company compliance config
CREATE TABLE IF NOT EXISTS company_legal_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  enabled_features JSONB NOT NULL,
  warnings JSONB NOT NULL,
  required_actions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee certifications (e.g., HACCP)
CREATE TABLE IF NOT EXISTS employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  company_id UUID NOT NULL,
  certification_type VARCHAR NOT NULL, -- e.g., 'HACCP'
  issued_at DATE NOT NULL,
  expires_at DATE,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance audits (immutable log)
CREATE TABLE IF NOT EXISTS compliance_audits (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  event_type VARCHAR NOT NULL, -- e.g., 'VALIDATE_OPERATION', 'CONFIG_UPDATE'
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal violations
CREATE TABLE IF NOT EXISTS legal_violations (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  violation_code VARCHAR NOT NULL,
  message TEXT NOT NULL,
  operation_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HACCP logs (temperature, etc.)
CREATE TABLE IF NOT EXISTS haccp_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  log_type VARCHAR NOT NULL, -- 'temperature', 'cleaning', 'inspection'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
