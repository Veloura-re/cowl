'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import CompactInvoiceForm from '@/components/ui/CompactInvoiceForm'
import { Activity } from 'lucide-react'

function EditInvoiceContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!id) return

        async function load() {
            setLoading(true)

            // 1. Invoice
            const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
            if (!invoice) {
                setLoading(false)
                return
            }

            // 2. Line Items
            const { data: lineItems } = await supabase.from('invoice_items').select('*, items(unit)').eq('invoice_id', id)

            // 3. Parties
            const { data: parties } = await supabase.from('parties').select('*').eq('business_id', invoice.business_id).in('type', ['CUSTOMER', 'BOTH']).order('name')

            // 4. Items
            const { data: items } = await supabase.from('items').select('*').eq('business_id', invoice.business_id).order('name')

            // 5. Payment Modes
            const { data: paymentModes } = await supabase.from('payment_modes').select('*').eq('business_id', invoice.business_id).order('name')

            setData({
                invoice,
                lineItems: lineItems || [],
                parties: parties || [],
                items: items || [],
                paymentModes: paymentModes || []
            })
            setLoading(false)
        }
        load()
    }, [id])

    if (!id) return <div className="p-10 text-center">Missing Invoice ID</div>
    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Activity className="h-6 w-6 text-[var(--primary-green)] animate-spin" />
        </div>
    )
    if (!data || !data.invoice) return <div className="p-10 text-center">Invoice not found</div>

    return (
        <CompactInvoiceForm
            parties={data.parties}
            items={data.items}
            paymentModes={data.paymentModes}
            initialData={data.invoice}
            initialLineItems={data.lineItems}
        />
    )
}

export default function EditInvoicePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditInvoiceContent />
        </Suspense>
    )
}
