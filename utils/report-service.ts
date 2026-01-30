import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'

export type ReportServiceType = 'SALES' | 'PURCHASES' | 'INVENTORY' | 'CUSTOMER_REPORT' | 'SUPPLIER_REPORT' | 'PARTY_SALES' | 'PARTY_PURCHASES'

export async function fetchReportDataService(
    businessId: string,
    type: ReportServiceType,
    startDate?: string,
    endDate?: string,
    partyId?: string
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
            value: (Number(item.stock_quantity) * Number(item.purchase_price))
        }));
    }

    if (type === 'CUSTOMER_REPORT') {
        // Customer Summary Report - Group all sales by customer
        let q = supabase
            .from('invoices')
            .select('party_id, total_amount, balance_amount, parties(name)')
            .eq('business_id', businessId)
            .eq('type', 'SALE')

        if (startDate) q = q.gte('date', startDate)
        if (endDate) q = q.lte('date', endDate)

        const { data, error } = await q
        if (error) throw error

        // Group by party
        const partyStats: Record<string, { name: string, total: number, balance: number, count: number }> = {}
        data?.forEach((inv: any) => {
            const id = inv.party_id || 'walking'
            const name = inv.parties?.name || 'Walking Customer'
            if (!partyStats[id]) partyStats[id] = { name, total: 0, balance: 0, count: 0 }
            partyStats[id].total += Number(inv.total_amount)
            partyStats[id].balance += Number(inv.balance_amount)
            partyStats[id].count += 1
        })

        return Object.values(partyStats).map(p => ({
            party: p.name,
            total: p.total,
            balance: p.balance,
            count: p.count,
            paid: p.total - p.balance
        })).sort((a, b) => b.total - a.total)
    }

    if (type === 'SUPPLIER_REPORT') {
        // Supplier Summary Report - Group all purchases by supplier
        let q = supabase
            .from('invoices')
            .select('party_id, total_amount, balance_amount, parties(name)')
            .eq('business_id', businessId)
            .eq('type', 'PURCHASE')

        if (startDate) q = q.gte('date', startDate)
        if (endDate) q = q.lte('date', endDate)

        const { data, error } = await q
        if (error) throw error

        // Group by party
        const partyStats: Record<string, { name: string, total: number, balance: number, count: number }> = {}
        data?.forEach((inv: any) => {
            const id = inv.party_id || 'unknown'
            const name = inv.parties?.name || 'Unknown Supplier'
            if (!partyStats[id]) partyStats[id] = { name, total: 0, balance: 0, count: 0 }
            partyStats[id].total += Number(inv.total_amount)
            partyStats[id].balance += Number(inv.balance_amount)
            partyStats[id].count += 1
        })

        return Object.values(partyStats).map(p => ({
            party: p.name,
            total: p.total,
            balance: p.balance,
            count: p.count,
            paid: p.total - p.balance
        })).sort((a, b) => b.total - a.total)
    }

    if (type === 'PARTY_SALES' || type === 'PARTY_PURCHASES') {
        // Detailed transactions for a specific party
        let q = supabase
            .from('invoices')
            .select('invoice_number, date, total_amount, status, balance_amount, parties(name)')
            .eq('business_id', businessId)
            .eq('type', type === 'PARTY_SALES' ? 'SALE' : 'PURCHASE')
            .order('date', { ascending: false })

        if (partyId) q = q.eq('party_id', partyId)
        if (startDate) q = q.gte('date', startDate)
        if (endDate) q = q.lte('date', endDate)

        const { data, error } = await q
        if (error) throw error

        return data.map((inv: any) => ({
            date: format(new Date(inv.date), 'MMM dd, yyyy'),
            number: inv.invoice_number,
            party: inv.parties?.name || (type === 'PARTY_SALES' ? 'Walking Customer' : 'Unknown'),
            status: inv.status,
            amount: inv.total_amount,
            balance: inv.balance_amount
        }))
    }

    // Default: Transactional Reports (Sales/Purchases)
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

