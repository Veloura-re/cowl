import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
import PurchasesClientView from './client-view'

export default async function PurchasePage() {
    const supabase = await createClient()

    // Fetch purchases
    const { data: purchases, error } = await supabase
        .from('invoices')
        .select('*, party:parties(name)')
        .eq('type', 'PURCHASE')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching purchases:', error)
    }

    return <PurchasesClientView initialInvoices={purchases || []} />
}
