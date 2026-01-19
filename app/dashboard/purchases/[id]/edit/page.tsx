import { createClient } from '@/utils/supabase/server'
import CompactInvoiceForm from '@/components/ui/CompactInvoiceForm'
import { notFound } from 'next/navigation'

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Invoice (Purchase)
    const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

    if (!invoice) notFound()

    // Fetch Line Items
    const { data: lineItems } = await supabase
        .from('invoice_items')
        .select('*, items(unit)')
        .eq('invoice_id', id)

    // Fetch Global Data
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
            initialData={invoice}
            initialLineItems={lineItems || []}
        />
    )
}
