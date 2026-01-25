-- RPC to get fast dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_business_id UUID)
RETURNS JSON AS $$
DECLARE
    v_revenue NUMERIC;
    v_parties_count INTEGER;
    v_total_stock INTEGER;
    v_low_stock_count INTEGER;
    v_pending_invoices_count INTEGER;
    v_total_expenses NUMERIC;
BEGIN
    -- 1. Calculate Revenue (Sum of Sales)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
    FROM invoices
    WHERE business_id = p_business_id AND type = 'SALE';

    -- 2. Count Parties
    SELECT COUNT(*) INTO v_parties_count
    FROM parties
    WHERE business_id = p_business_id;

    -- 3. Stock Stats
    SELECT 
        COALESCE(SUM(stock_quantity), 0),
        COUNT(*) FILTER (WHERE stock_quantity <= min_stock)
    INTO v_total_stock, v_low_stock_count
    FROM items
    WHERE business_id = p_business_id AND type = 'PRODUCT';

    -- 4. Pending Invoices count
    SELECT COUNT(*) INTO v_pending_invoices_count
    FROM invoices
    WHERE business_id = p_business_id AND status = 'UNPAID';

    -- 5. Total Expenses (Purchases + Payments)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_expenses
    FROM invoices
    WHERE business_id = p_business_id AND type = 'PURCHASE';
    
    v_total_expenses := v_total_expenses + (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE business_id = p_business_id AND type = 'PAYMENT'
    );

    RETURN json_build_object(
        'revenue', v_revenue,
        'parties', v_parties_count,
        'stock', v_total_stock,
        'lowStockCount', v_low_stock_count,
        'pending', v_pending_invoices_count,
        'totalExpenses', v_total_expenses
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
