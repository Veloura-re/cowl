import { createClient } from '@/utils/supabase/server'
import CompactInvoiceForm from '@/components/ui/CompactInvoiceForm'

export default async function NewInvoicePage() {
    const supabase = await createClient()

    const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .in('type', ['CUSTOMER', 'BOTH'])
        .order('name')

    const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('name')

    const { data: paymentModes } = await supabase
        .from('payment_modes')
        .select('*')
        .order('name')

    return <CompactInvoiceForm parties={parties || []} items={items || []} paymentModes={paymentModes || []} />
}
