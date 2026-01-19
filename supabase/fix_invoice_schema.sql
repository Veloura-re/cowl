-- Add missing columns to invoices table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='discount_amount') THEN
        ALTER TABLE public.invoices ADD COLUMN discount_amount numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='shipping_charges') THEN
        ALTER TABLE public.invoices ADD COLUMN shipping_charges numeric DEFAULT 0;
    END IF;
END $$;

-- Also check invoice_items for tax_amount and purchase_price
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='tax_amount') THEN
        ALTER TABLE public.invoice_items ADD COLUMN tax_amount numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='purchase_price') THEN
        ALTER TABLE public.invoice_items ADD COLUMN purchase_price numeric DEFAULT 0;
    END IF;
END $$;

-- Reloading schema cache is done via Supabase Dashboard -> Settings -> API -> PostgREST -> Reload Schema
-- Or by waiting a few minutes.

-- Fix Ambiguity in notify_members
create or replace function public.notify_members(_business_id uuid, _type text, _title text, _message text, _link text default null)
returns void as $$
declare
  member_record record;
begin
  for member_record in 
    select bm.user_id from public.business_members bm
    join public.notification_settings ns on ns.user_id = bm.user_id and ns.business_id = bm.business_id
    where bm.business_id = _business_id
    and (
      (_type = 'SALE' and ns.notify_sales) or
      (_type = 'PURCHASE' and ns.notify_purchases) or
      (_type = 'STOCK' and ns.notify_stock) or
      (_type = 'TEAM' and ns.notify_team)
    )
  loop
    insert into public.notifications (business_id, user_id, title, message, type, link)
    values (_business_id, member_record.user_id, _title, _message, _type, _link);
  end loop;
end;
$$ language plpgsql security definer;

-- Make invoice_number nullable
ALTER TABLE public.invoices ALTER COLUMN invoice_number DROP NOT NULL;

-- Fix RLS for invoice_items (Missing in original schema)
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Members can view invoice items') THEN
        CREATE POLICY "Members can view invoice items" ON public.invoice_items 
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND is_business_member(i.business_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Members can insert invoice items') THEN
        CREATE POLICY "Members can insert invoice items" ON public.invoice_items 
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND is_business_member(i.business_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Members can update invoice items') THEN
        CREATE POLICY "Members can update invoice items" ON public.invoice_items 
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND is_business_member(i.business_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Members can delete invoice items') THEN
        CREATE POLICY "Members can delete invoice items" ON public.invoice_items 
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND is_business_member(i.business_id)));
    END IF;
END $$;
