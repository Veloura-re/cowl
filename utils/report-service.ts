import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'

export async function fetchReportDataService(
    businessId: string,
    type: 'SALES' | 'PURCHASES' | 'INVENTORY',
    startDate?: string,
    endDate?: string
) {
    const supabase = createClient()

    if (type === 'INVENTORY') {
        // Inventory Report (Snapshot of current state)
        const { data: items, error } = await supabase
            .from('items')
            .select('name, sku, stock_quantity, unit, purchase_price, selling_price')
            .eq('business_id', businessId)
            .order('name');

        if (error) throw error;

        return items.map(item => ({
            item: item.name,
            sku: item.sku || '-',
            stock: `${item.stock_quantity} ${item.unit}`,
            cost: item.purchase_price,
            value: (Number(item.stock_quantity) * Number(item.selling_price))
        }));
    }

    // Transactional Reports (Sales/Purchases)
    let q = supabase
        .from('invoices')
        .select(`
            invoice_number,
            date,
            total_amount,
            status,
            balance_amount,
            parties (name)
        `)
        .eq('business_id', businessId)
        .eq('type', type === 'SALES' ? 'SALE' : 'PURCHASE')
        .order('date', { ascending: false })

    if (startDate) q = q.gte('date', startDate)
    if (endDate) q = q.lte('date', endDate)

    const { data: result, error: fetchError } = await q

    if (fetchError) throw fetchError

    // Process data for report
    return result.map(inv => ({
        date: format(new Date(inv.date), 'MMM dd, yyyy'),
        number: inv.invoice_number,
        party: (inv.parties as any)?.name || 'Walking Customer',
        status: inv.status,
        amount: inv.total_amount,
        balance: inv.balance_amount
    }))
}
