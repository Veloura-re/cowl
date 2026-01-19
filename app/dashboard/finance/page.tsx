import { createClient } from '@/utils/supabase/server'
import FinanceClientView from './client-view'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const supabase = await createClient()

    // Fetch recent transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, party:parties(name)')
        .order('date', { ascending: false })
        .limit(20)

    // Calculate Balances?
    // Ideally we sum up transactions grouped by mode.
    // We can do this on DB or client. For MVP, fetching all transactions to sum is heavy.
    // We'll trust the "limit 20" for list, but maybe we need an aggregate query for balances.

    // Aggregate Balance Query
    // Supabase/PostgREST doesn't support easy aggregates without view/rpc.
    // I'll create a simple client-side calc based on a larger fetch or separate robust query later.
    // For now, I'll pass transactions and let client handle limited view, 
    // and maybe mocks for "Cash in Hand" unless we implement a `accounts` table which wasn't in schema.
    // Schema has `transactions` with `mode`.
    // We can sum `amount` where `type=RECEIPT` - `type=PAYMENT`.

    return <FinanceClientView initialTransactions={transactions || []} />
}
