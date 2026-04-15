-- ============================================================
-- 99Tests 2.0 — Migration 022: Invoice PDF Configuration
-- ============================================================

-- 1. Add company details + invoice config to tt_service_config
ALTER TABLE tt_service_config
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Wir sind Immun GmbH',
ADD COLUMN IF NOT EXISTS company_street TEXT DEFAULT 'Musterstraße 1',
ADD COLUMN IF NOT EXISTS company_zip_city TEXT DEFAULT '60311 Frankfurt am Main',
ADD COLUMN IF NOT EXISTS company_country TEXT DEFAULT 'Deutschland',
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_registry TEXT DEFAULT 'Amtsgericht Frankfurt HRB XXXXX',
ADD COLUMN IF NOT EXISTS company_ust_id TEXT DEFAULT 'DE123456789',
ADD COLUMN IF NOT EXISTS company_tax_id TEXT DEFAULT '045/123/45678',
ADD COLUMN IF NOT EXISTS company_bank_name TEXT DEFAULT 'Deutsche Bank',
ADD COLUMN IF NOT EXISTS company_iban TEXT DEFAULT 'DE89 3704 0044 0532 0130 00',
ADD COLUMN IF NOT EXISTS company_bic TEXT DEFAULT 'COBADEFFXXX',
ADD COLUMN IF NOT EXISTS company_ceo TEXT DEFAULT '[Name]',
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV-',
ADD COLUMN IF NOT EXISTS invoice_payment_terms_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS invoice_billing_period TEXT DEFAULT 'monthly';

-- 2. Add file_path to tt_doctor_invoice
ALTER TABLE tt_doctor_invoice
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- 3. Set up Storage for Invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls for invoices storage
-- Admins can do anything
CREATE POLICY "Admins can manage invoices"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'invoices' AND (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Authenticated users (like service role / generated) can upload
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'invoices' AND auth.role() = 'authenticated' );

-- Doctors can view their own documents (simplified path match: foldername is doctor_id)
-- But wait, invoices will be grouped by doctor? 
-- In our plan, file_path looks like "doctor_id/invoice-INV-XYZ.pdf"
-- Let's make doctors able to select objects if the path starts with their auth uid
CREATE POLICY "Doctors can view own invoices"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1] );

