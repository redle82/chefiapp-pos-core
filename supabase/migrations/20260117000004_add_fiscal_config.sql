-- Add Fiscal Configuration to Restaurants
-- Purpose: Enable selection of fiscal providers (InvoiceXpress, Moloni) and storage of credentials.
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS fiscal_provider VARCHAR(50) DEFAULT 'mock',
    ADD COLUMN IF NOT EXISTS fiscal_config JSONB DEFAULT '{}'::jsonb;
-- Comment on columns
COMMENT ON COLUMN public.gm_restaurants.fiscal_provider IS 'Provider used for fiscal documents: mock, invoice_xpress, moloni, saft_pt, ticketbai';
COMMENT ON COLUMN public.gm_restaurants.fiscal_config IS 'Encrypted/Secure configuration for the provider (API Keys, etc)';
-- Add to Legal Profiles (optional, for default country rules)
-- NOT needed yet, gm_restaurants is enough.