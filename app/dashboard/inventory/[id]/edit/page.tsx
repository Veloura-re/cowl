import { createClient } from '@/utils/supabase/server'
import CompactItemForm from '@/components/ui/CompactItemForm'
import { notFound } from 'next/navigation'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: item } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

    if (!item) notFound()

    return <CompactItemForm initialData={item} />
}
