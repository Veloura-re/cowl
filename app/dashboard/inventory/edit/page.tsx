'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import CompactItemForm from '@/components/ui/CompactItemForm'
import { Activity } from 'lucide-react'

function EditInventoryContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [item, setItem] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!id) return

        async function load() {
            setLoading(true)
            const { data } = await supabase
                .from('items')
                .select('*')
                .eq('id', id)
                .single()
            setItem(data)
            setLoading(false)
        }
        load()
    }, [id])

    if (!id) return <div className="p-10 text-center">Missing Item ID</div>
    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Activity className="h-6 w-6 text-[var(--primary-green)] animate-spin" />
        </div>
    )
    if (!item) return <div className="p-10 text-center">Item not found</div>

    return <CompactItemForm initialData={item} />
}

export default function EditInventoryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditInventoryContent />
        </Suspense>
    )
}
