'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import PartyLedgerView from './ledger-view'
import { Activity } from 'lucide-react'

function PartyViewContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [data, setData] = useState<{ party: any, invoices: any[], transactions: any[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!id) return

        async function loadData() {
            setLoading(true)

            const { data: party } = await supabase
                .from('parties')
                .select('*')
                .eq('id', id)
                .single()

            if (!party) {
                setLoading(false)
                return
            }

            const { data: invoices } = await supabase
                .from('invoices')
                .select('*')
                .eq('party_id', id)
                .order('date', { ascending: false })

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('party_id', id)
                .order('date', { ascending: false })

            setData({
                party,
                invoices: invoices || [],
                transactions: transactions || []
            })
            setLoading(false)
        }

        loadData()
    }, [id])

    if (!id) return <div className="p-10 text-center">Missing Party ID</div>
    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Activity className="h-6 w-6 text-[var(--primary-green)] animate-spin" />
        </div>
    )
    if (!data) return <div className="p-10 text-center">Party not found</div>

    return <PartyLedgerView party={data.party} initialInvoices={data.invoices} initialTransactions={data.transactions} />
}

export default function PartyViewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartyViewContent />
        </Suspense>
    )
}
