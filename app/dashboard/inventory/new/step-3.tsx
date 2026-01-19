'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle2, Package as PackageIcon } from 'lucide-react'
import { useItem } from '@/context/item-context'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'

type Step3Props = {
    onComplete: () => void
    onBack: () => void
}

export default function Step3Review({ onComplete, onBack }: Step3Props) {
    const { data, resetData } = useItem()
    const { activeBusinessId, formatCurrency } = useBusiness()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()



    const handleSave = async () => {
        if (!activeBusinessId) {
            setError('No active business found')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { error: insertError } = await supabase.from('items').insert({
                business_id: activeBusinessId,
                name: data.name,
                sku: data.sku,
                type: data.type,
                category: data.category,
                description: data.description,
                unit: data.unit,
                selling_price: data.selling_price,
                purchase_price: data.purchase_price,
                stock_quantity: data.type === 'PRODUCT' ? data.stock_quantity : 0,
                min_stock: data.type === 'PRODUCT' ? data.min_stock : 0
            })

            if (insertError) throw insertError

            setSuccess(true)
            setTimeout(() => {
                onComplete()
            }, 1500)
        } catch (err: any) {
            setError(err.message || 'Failed to save item')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="glass rounded-[24px] border border-white/40 overflow-hidden">
                <div className="p-12 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--primary-green)] blur-2xl opacity-30 animate-pulse" />
                            <CheckCircle2 className="relative h-20 w-20 text-[var(--primary-green)] animate-in zoom-in duration-500" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Item Added!</h2>
                        <p className="text-sm font-bold text-[var(--foreground)]/60 uppercase tracking-wider mt-2">Redirecting to inventory...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass rounded-[24px] border border-white/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-[var(--primary-green)]/5">
                <h2 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Review & Confirm</h2>
                <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Verify all details before saving</p>
            </div>

            <div className="p-8 space-y-6">
                {/* Item Summary Card */}
                <div className="glass rounded-2xl border border-white/30 p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-[var(--primary-green)]/10">
                            <PackageIcon className="h-6 w-6 text-[var(--primary-green)]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-[var(--deep-contrast)]">{data.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/40 text-[var(--foreground)]/60">
                                    {data.type}
                                </span>
                                {data.category && (
                                    <span className="text-[9px] font-bold text-[var(--foreground)]/40">{data.category}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {data.description && (
                        <p className="text-sm text-[var(--foreground)]/60 mt-3 p-3 rounded-xl bg-white/20">
                            {data.description}
                        </p>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Unit</div>
                        <div className="text-sm font-bold text-[var(--deep-contrast)]">{data.unit}</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Selling Price</div>
                        <div className="text-sm font-bold text-[var(--primary-green)]">{formatCurrency(data.selling_price)}/{data.unit}</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Purchase Price</div>
                        <div className="text-sm font-bold text-[var(--deep-contrast)]">{formatCurrency(data.purchase_price)}/{data.unit}</div>
                    </div>

                </div>

                {/* Stock Info (Products Only) */}
                {data.type === 'PRODUCT' && (
                    <div className="glass rounded-2xl border border-white/30 p-6">
                        <h4 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight mb-4">Stock Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Initial Stock</div>
                                <div className="text-lg font-bold text-[var(--deep-contrast)]">{data.stock_quantity} {data.unit}</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Low Stock Alert</div>
                                <div className="text-lg font-bold text-[var(--deep-contrast)]">{data.min_stock} {data.unit}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SKU */}
                {data.sku && (
                    <div className="p-4 rounded-xl bg-white/20 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mr-2">SKU:</span>
                        <span className="text-sm font-bold text-[var(--deep-contrast)]">{data.sku}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-sm font-bold text-red-500">{error}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/50 border border-white/30 text-[var(--deep-contrast)] font-bold text-sm uppercase tracking-wider hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary-green)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Item
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
