import { createClient } from '@/utils/supabase/server'
import InvoiceForm from './invoice-form'

export default async function NewInvoicePage() {
    const supabase = await createClient()

    const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .eq('type', 'CUSTOMER') // Or BOTH
        .order('name')

    const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('name')

    // We should also fetch next invoice number logic here or in client?
    // Ideally server-side or DB function. For now, client can input or generate random.

    return <InvoiceForm parties={parties || []} items={items || []} />
}
