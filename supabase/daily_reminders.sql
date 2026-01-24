-- Daily Stock Reminder Logic

-- 1. Table to track daily checks per business
CREATE TABLE IF NOT EXISTS public.daily_check_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    check_type TEXT NOT NULL, -- e.g., 'STOCK_REMINDER'
    last_check_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(business_id, check_type, last_check_at)
);

-- 2. Function to trigger daily reminders
CREATE OR REPLACE FUNCTION public.trigger_daily_stock_reminders(p_business_id UUID)
RETURNS VOID AS $$
DECLARE
    low_stock_count INTEGER;
    low_stock_summary TEXT;
    member_record RECORD;
BEGIN
    -- Only proceed if hasn't run today
    IF EXISTS (
        SELECT 1 FROM public.daily_check_logs 
        WHERE business_id = p_business_id 
        AND check_type = 'STOCK_REMINDER' 
        AND last_check_at = CURRENT_DATE
    ) THEN
        RETURN;
    END IF;

    -- Count low stock items
    SELECT count(*) INTO low_stock_count
    FROM public.items
    WHERE business_id = p_business_id
    AND type = 'PRODUCT'
    AND stock_quantity <= min_stock;

    -- If low items exist, notify members
    IF low_stock_count > 0 THEN
        IF low_stock_count = 1 THEN
            low_stock_summary := 'There is 1 item running low on stock.';
        ELSE
            low_stock_summary := 'There are ' || low_stock_count || ' items running low on stock.';
        END IF;

        -- We use the existing notify_members helper from schema.sql
        PERFORM public.notify_members(
            p_business_id, 
            'STOCK', 
            'Daily Stock Summary', 
            low_stock_summary || ' Check your inventory to replenish.',
            '/dashboard/inventory'
        );
    END IF;

    -- Log the successful check
    INSERT INTO public.daily_check_logs (business_id, check_type, last_check_at)
    VALUES (p_business_id, 'STOCK_REMINDER', CURRENT_DATE)
    ON CONFLICT (business_id, check_type, last_check_at) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
