'use client'

import { CheckCircle2, FileText, Plus, List } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'

type Step4Props = {
    onComplete: () => void
}

export default function Step4Success({ onComplete }: Step4Props) {
    const { data, resetData } = useInvoice()
    const { formatCurrency } = useBusiness()

    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
    const totalTax = data.items.reduce((sum, item) => sum + ((item.amount * item.tax) / 100), 0)
    const grandTotal = subtotal + totalTax

    const handleCreateAnother = () => {
        resetData()
        window.location.reload()
    }

    return (
        <div className="glass rounded-[24px] border border-gray-200 overflow-hidden">
            <div className="p-12 text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[var(--primary-green)] blur-2xl opacity-30 animate-pulse" />
                        <CheckCircle2 className="relative h-20 w-20 text-[var(--primary-green)] animate-in zoom-in duration-500" />
                    </div>
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Invoice Created!</h2>
                    <p className="text-sm font-bold text-[var(--foreground)]/60 uppercase tracking-wider">Your sale has been recorded successfully</p>
                </div>

                {/* Invoice Summary */}
                <div className="glass rounded-2xl border border-white/30 p-6 max-w-md mx-auto">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">Invoice Number</span>
                            <span className="text-sm font-bold text-[var(--deep-contrast)]">{data.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">Customer</span>
                            <span className="text-sm font-bold text-[var(--deep-contrast)]">{data.partyName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">Items</span>
                            <span className="text-sm font-bold text-[var(--deep-contrast)]">{data.items.length}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-white/20">
                            <span className="text-sm font-bold uppercase tracking-wider text-[var(--deep-contrast)]">Total Amount</span>
                            <span className="text-lg font-bold text-[var(--primary-green)]">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 max-w-2xl mx-auto">
                    <Link
                        href="/dashboard/sales"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 border border-white/30 hover:bg-white/10 hover:border-[var(--primary-green)] transition-all group"
                    >
                        <List className="h-6 w-6 text-[var(--primary-green)] group-hover:scale-110 transition-transform" />
                        <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--deep-contrast)]">View All Sales</span>
                    </Link>

                    <button
                        onClick={handleCreateAnother}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--primary-green)] text-white hover:bg-[var(--primary-hover)] transition-all group shadow-lg shadow-[var(--primary-green)]/20"
                    >
                        <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[14px] font-bold uppercase tracking-wider">Create Another</span>
                    </button>

                    <button
                        onClick={onComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 border border-white/30 hover:bg-white/10 hover:border-[var(--primary-green)] transition-all group"
                    >
                        <FileText className="h-6 w-6 text-[var(--primary-green)] group-hover:scale-110 transition-transform" />
                        <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--deep-contrast)]">Done</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
