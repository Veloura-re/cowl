-- Add invoice settings columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS invoice_accent_color text DEFAULT '#111827',
ADD COLUMN IF NOT EXISTS invoice_footer_note text,
ADD COLUMN IF NOT EXISTS invoice_size text DEFAULT 'A4' CHECK (invoice_size IN ('A4', 'THERMAL', 'NANO'));
