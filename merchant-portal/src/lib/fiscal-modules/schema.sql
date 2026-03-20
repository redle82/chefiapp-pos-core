-- FISCAL SCHEMA (GATE 5.1)
-- Independent from Core Schema (but references it)
-- Ideally, run this in a separate schema "fiscal"
-- CREATE SCHEMA IF NOT EXISTS fiscal;
CREATE TABLE IF NOT EXISTS fiscal_event_store (
    fiscal_event_id UUID PRIMARY KEY,
    fiscal_sequence_id BIGSERIAL NOT NULL,
    -- Global Fiscal Ordering
    -- Linkage to Truth (The Check-Mate)
    ref_seal_id VARCHAR(255) NOT NULL REFERENCES legal_seals(seal_id),
    ref_event_id UUID NOT NULL REFERENCES event_store(event_id),
    -- Fiscal Details
    doc_type VARCHAR(50) NOT NULL,
    -- 'SAT_CFE', 'NFC_E'
    gov_protocol VARCHAR(255),
    -- Protocol # from Government
    -- Payloads (Evidence)
    payload_sent JSONB NOT NULL,
    response_received JSONB,
    -- Status
    fiscal_status VARCHAR(50) NOT NULL,
    -- 'PENDING', 'ACCEPTED', 'REJECTED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Idempotency: One successful fiscal document per Legal Seal?
    -- Usually yes, unless it's a correction/cancel. 
    -- For simplicity of Minimum, we enforce Unique Seal linkage.
    UNIQUE(ref_seal_id, doc_type)
);
-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_fiscal_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_fiscal_modtime BEFORE
UPDATE ON fiscal_event_store FOR EACH ROW EXECUTE FUNCTION update_fiscal_timestamp();