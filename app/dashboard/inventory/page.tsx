import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
import InventoryClientView from './client-view'

export default async function InventoryPage() {
    const supabase = await createClient()

    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching items:', error)
    }

    return <InventoryClientView initialItems={items || []} />
}
