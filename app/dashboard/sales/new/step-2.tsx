'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Plus, Trash2, Package } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import AddSalesItemModal from '@/components/ui/AddSalesItemModal'
import clsx from 'clsx'

type Step2Props = {
    items: any[]
    onNext: () => void
    onBack: () => void
}

export default function Step2AddItems({ items, onNext, onBack }: Step2Props) {
    const { data, addItem, updateItem, removeItem } = useInvoice()
    const { formatCurrency } = useBusiness()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [error, setError] = useState('')

    const handleAddItem = (itemData: any) => {
        addItem(itemData)
    }

    const handleQuantityChange = (index: number, val: string) => {
        const quantity = val === '' ? 0 : Number(val)
        const item = data.items[index]
        const amount = quantity * item.rate
        updateItem(index, { quantity: val as any, amount })
    }

    const handleRateChange = (index: number, val: string) => {
        const rate = val === '' ? 0 : Number(val)
        const item = data.items[index]
        const amount = item.quantity * rate
        updateItem(index, { rate: val as any, amount })
    }

    const handleNext = () => {
        if (data.items.length === 0) {
            setError('Please add at least one item')
            return
        }
        setError('')
        onNext()
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)

    return (
        <div className="glass rounded-[32px] border border-[var(--foreground)]/10 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <div className="px-8 py-6 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-[16px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Line Specification</h2>
                    <p className="text-[13px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Define assets for this ledger event</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="relative z-10 flex items-center gap-3 px-6 py-3 rounded-2xl bg-[var(--primary-green)] text-white font-black text-[15px] uppercase tracking-[0.15em] hover:bg-[var(--primary-hover)] transition-all shadow-xl shadow-[var(--primary-green)]/30 active:scale-95 group"
                >
                    <div className="h-6 w-6 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                        <Plus className="h-4 w-4" />
                    </div>
                    APPEND ITEM
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-green)]/10 to-transparent pointer-none" />
            </div>

            <div className="p-6 space-y-4 min-h-[400px]">
                {data.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                        <div className="h-20 w-20 bg-[var(--foreground)]/5 rounded-[40px] flex items-center justify-center mb-6 border border-[var(--foreground)]/5">
                            <Package size={40} strokeWidth={1.5} />
                        </div>
                        <p className="text-[15px] font-black uppercase tracking-[0.4em]">Inventory Manifest is Empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.items.map((item, index) => (
                            <div key={index} className="group relative glass p-5 rounded-3xl border border-white/10 hover:bg-white/5 transition-all shadow-sm hover:shadow-xl">
                                <button
                                    onClick={() => removeItem(index)}
                                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl active:scale-90 opacity-0 group-hover:opacity-100 transition-opacity z-10 border-4 border-white dark:border-[var(--background)]"
                                >
                                    <Trash2 size={12} strokeWidth={3} />
                                </button>

                                <div className="flex items-center gap-5 mb-5 border-b border-[var(--foreground)]/5 pb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--primary-green)]/10 text-[var(--primary-green)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[17px] font-black text-[var(--deep-contrast)] uppercase tracking-tight truncate">{item.name}</div>
                                        <div className="text-[13px] font-black text-[var(--foreground)]/30 uppercase tracking-widest mt-0.5">Asset Ref-0{index + 1}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Volume</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="any"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                className="w-full h-11 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 px-4 text-[17px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner tabular-nums"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[var(--foreground)]/20 uppercase tracking-widest">{item.unit}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Yield / Unit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="any"
                                                value={item.rate}
                                                onChange={(e) => handleRateChange(index, e.target.value)}
                                                className="w-full h-11 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 px-4 text-[17px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner tabular-nums"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[var(--foreground)]/20 uppercase">/ {item.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[var(--foreground)]/5 flex justify-between items-center">
                                    <div>
                                        {item.tax > 0 && (
                                            <p className="text-[12px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em]">
                                                Taxation Impact: {item.tax}%
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-0.5">Asset Valuation</p>
                                        <p className="text-[20px] font-black text-[var(--primary-green)] tabular-nums font-mono tracking-tighter">{formatCurrency(item.amount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-[20px] bg-rose-500/5 border border-rose-500/10 text-center animate-bounce">
                        <p className="text-[13px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                    </div>
                )}
            </div>

            {/* Navigation & Summary */}
            <div className="px-8 py-6 border-t border-[var(--foreground)]/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-md">
                <div className="flex items-end gap-1.5 order-2 sm:order-1">
                    <div>
                        <p className="text-[13px] font-black uppercase tracking-[0.3em] text-[var(--foreground)]/30 mb-0.5 ml-1">Aggregate Estimation</p>
                        <p className="text-[36px] font-black text-[var(--deep-contrast)] tabular-nums tracking-tighter leading-none">
                            {formatCurrency(subtotal)}
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-[var(--foreground)]/5 text-[13px] font-black text-[var(--foreground)]/40 uppercase tracking-widest border border-[var(--foreground)]/10 mb-1">
                        {data.items.length} ASSETS
                    </span>
                </div>

                <button
                    onClick={handleNext}
                    className="w-full sm:w-64 h-16 flex items-center justify-between px-8 rounded-[32px] bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] font-black text-sm uppercase tracking-[0.2em] hover:bg-[var(--deep-contrast-hover)] transition-all shadow-2xl shadow-[var(--deep-contrast)]/20 active:scale-95 group order-1 sm:order-2"
                >
                    PROCEED
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[var(--primary-green)] transition-all group-hover:scale-110">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </button>
            </div>

            <AddSalesItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddItem}
                items={items}
            />
        </div>
    )
}
