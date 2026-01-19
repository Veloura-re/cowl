import { createClient } from '@/utils/supabase/server'
import CompactInvoiceForm from '@/components/ui/CompactInvoiceForm'

export default function NewPurchasePage() {
    return (
        <CompactInvoiceForm
            initialData={{ type: 'PURCHASE' }} // Default to Purchase type
        />
    )
}
