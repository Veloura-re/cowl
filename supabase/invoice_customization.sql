-- Add invoice customization columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS invoice_accent_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS invoice_footer_note text DEFAULT '',
ADD COLUMN IF NOT EXISTS invoice_size text DEFAULT 'A4' CHECK (invoice_size IN ('A4', 'THERMAL'));
