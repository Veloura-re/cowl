'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import PaymentForm from '@/components/ui/PaymentForm'
import { Activity } from 'lucide-react'

function EditFinanceContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!id) return

        async function load() {
            setLoading(true)

            // 1. Transaction
            const { data: transaction } = await supabase.from('transactions').select('*').eq('id', id).single()

            if (!transaction) {
                setLoading(false)
                return
            }

            // 2. Linked Invoice Items
            let billingEntries: any[] = []
            if (transaction.invoice_id) {
                const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', transaction.invoice_id)
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

            // 3. Parties
            const partyTypes = transaction.type === 'RECEIPT' ? ['CUSTOMER', 'BOTH'] : ['SUPPLIER', 'BOTH']
            const { data: parties } = await supabase
                .from('parties')
                .select('id, name')
                .eq('business_id', transaction.business_id)
                .in('type', partyTypes)
                .order('name')

            // 4. Items
            const { data: items } = await supabase.from('items').select('*').order('name')

            // 5. Payment Modes
            const { data: paymentModes } = await supabase.from('payment_modes').select('*').order('name')

            setData({
                transaction,
                billingEntries,
                parties: parties || [],
                items: items || [],
                paymentModes: paymentModes || []
            })
            setLoading(false)
        }
        load()
    }, [id])

    if (!id) return <div className="p-10 text-center">Missing Transaction ID</div>
    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Activity className="h-6 w-6 text-[var(--primary-green)] animate-spin" />
        </div>
    )
    if (!data || !data.transaction) return <div className="p-10 text-center">Transaction not found</div>

    return (
        <PaymentForm
            initialData={data.transaction}
            initialBillingEntries={data.billingEntries}
            parties={data.parties}
            allItems={data.items}
            paymentModes={data.paymentModes}
        />
    )
}

export default function EditFinancePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditFinanceContent />
        </Suspense>
    )
}
