import { createClient } from '@/utils/supabase/server'
import PartiesClientView from './client-view'

export default async function PartiesPage() {
    const supabase = await createClient()

    // Fetch parties
    const { data: parties, error } = await supabase
        .from('parties')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching parties:', error)
    }

    return <PartiesClientView initialParties={parties || []} />
}
