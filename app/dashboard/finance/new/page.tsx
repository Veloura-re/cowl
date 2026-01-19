import { createClient } from '@/utils/supabase/server'
import PaymentForm from '@/components/ui/PaymentForm'

export const dynamic = 'force-dynamic'

export default async function NewFinancePage({ searchParams }: { searchParams: { type?: 'RECEIPT' | 'PAYMENT' } }) {
    const supabase = await createClient()
    const type = searchParams.type || 'RECEIPT'

    // Fetch Data
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
            type={type}
            parties={parties || []}
            allItems={items || []}
            paymentModes={paymentModes || []}
        />
    )
}
