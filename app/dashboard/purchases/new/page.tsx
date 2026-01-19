import { createClient } from '@/utils/supabase/server'
import CompactInvoiceForm from '@/components/ui/CompactInvoiceForm'

export const dynamic = 'force-dynamic'

export default async function NewPurchasePage() {
    const supabase = await createClient()

    // Fetch Suppliers
    const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .in('type', ['SUPPLIER', 'BOTH'])
        .order('name')

    const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('name')

    const { data: paymentModes } = await supabase
        .from('payment_modes')
        .select('*')
        .order('name')

    return (
        <CompactInvoiceForm
            parties={parties || []}
            items={items || []}
            paymentModes={paymentModes || []}
            initialData={{ type: 'PURCHASE' }}
        />
    )
}
