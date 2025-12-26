import { createClient } from '@/utils/supabase/server'
import PartyLedgerView from './ledger-view'
import { notFound } from 'next/navigation'

export default async function PartyDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!party) {
        notFound()
    }

    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('party_id', params.id)
        .order('date', { ascending: false })

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('party_id', params.id)
        .order('date', { ascending: false })

    return <PartyLedgerView party={party} initialInvoices={invoices || []} initialTransactions={transactions || []} />
}
