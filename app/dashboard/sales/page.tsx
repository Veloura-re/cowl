import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
import SalesClientView from './client-view'

export default async function SalesPage() {
    const supabase = await createClient()

    // Fetch invoices (sales)
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, party:parties(name)')
        .eq('type', 'SALE')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching sales:', error)
    }

    return <SalesClientView initialInvoices={invoices || []} />
}
