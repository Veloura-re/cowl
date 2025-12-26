import { createClient } from '@/utils/supabase/server'
import PurchaseForm from './purchase-form'

export default async function NewPurchasePage() {
    const supabase = await createClient()

    // Fetch Suppliers
    const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .in('type', ['SUPPLIER', 'BOTH'])
        .order('name')

    const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('name')

    return <PurchaseForm parties={parties || []} items={items || []} />
}
