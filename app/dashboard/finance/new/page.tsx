'use client'

import PaymentForm from '@/components/ui/PaymentForm'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewFinancePageContent() {
    const searchParams = useSearchParams()
    const type = (searchParams.get('type') as 'RECEIPT' | 'PAYMENT') || 'RECEIPT'

    return (
        <PaymentForm
            type={type}
        />
    )
}

export default function NewFinancePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewFinancePageContent />
        </Suspense>
    )
}
