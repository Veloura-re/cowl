import { createClient } from '@/utils/supabase/server'
import PaymentForm from '@/components/ui/PaymentForm'
import { notFound } from 'next/navigation'

export default async function EditFinancePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Transaction
    const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

    if (!transaction) notFound()

    // Fetch Linked Invoice Items (if any)
    let billingEntries: any[] = []
    if (transaction.invoice_id) {
        const { data: items } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', transaction.invoice_id)

        if (items) {
            billingEntries = items.map(item => ({
                id: item.id,
                itemId: item.item_id,
                name: item.description,
                quantity: item.quantity,
                rate: item.rate,
                tax: (item.tax_amount / (item.quantity * item.rate)) * 100 || 0,
                amount: item.total
            }))
        }
    }

    // Fetch Global Data
    const { data: parties } = await supabase
        .from('parties')
        .select('id, name')
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
        <PaymentForm
            initialData={transaction}
            initialBillingEntries={billingEntries}
            parties={parties || []}
            allItems={items || []}
            paymentModes={paymentModes || []}
        />
    )
}
