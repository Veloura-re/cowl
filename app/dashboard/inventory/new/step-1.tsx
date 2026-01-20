'use client'

import { useState } from 'react'
import { ArrowRight, Package, Tag } from 'lucide-react'
import { useItem } from '@/context/item-context'
import clsx from 'clsx'

type Step1Props = {
    onNext: () => void
}

export default function Step1BasicInfo({ onNext }: Step1Props) {
    const { data, updateData } = useItem()
    const [error, setError] = useState('')

    const handleNext = () => {
        if (!data.name.trim()) {
            setError('Please enter item name')
            return
        }
        setError('')
        onNext()
    }

    return (
        <div className="glass rounded-2xl border border-white/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-[var(--primary-green)]/5">
                <h2 className="text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Basic Information</h2>
                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Item details and classification</p>
            </div>

            <div className="p-5 space-y-4">
                {/* Item Name - Large Input */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-2">
                        Item Name *
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => {
                            updateData({ name: e.target.value })
                            setError('')
                        }}
                        className={clsx(
                            "w-full h-14 rounded-xl bg-white/50 border-2 px-4 text-base font-bold text-[var(--deep-contrast)] focus:outline-none shadow-inner transition-all",
                            error ? "border-red-500" : "border-white/30 focus:border-[var(--primary-green)]"
                        )}
                        placeholder="e.g., Premium Cotton Fabric"
                    />
                    {error && (
                        <p className="text-[9px] font-bold text-red-500 mt-2 ml-1">{error}</p>
                    )}
                </div>

                {/* Type Selection */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-3">
                        Item Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => updateData({ type: 'PRODUCT' })}
                            className={clsx(
                                "p-5 rounded-xl border-2 transition-all text-left",
                                data.type === 'PRODUCT'
                                    ? "bg-white/60 border-[var(--primary-green)]"
                                    : "bg-white/20 border-white/30 hover:border-[var(--primary-green)]/50"
                            )}
                        >
                            <Package className={clsx(
                                "h-6 w-6 mb-2",
                                data.type === 'PRODUCT' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40"
                            )} />
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">Product</div>
                            <div className="text-[9px] font-bold text-[var(--foreground)]/40 mt-0.5">Physical goods with stock</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateData({ type: 'SERVICE' })}
                            className={clsx(
                                "p-5 rounded-xl border-2 transition-all text-left",
                                data.type === 'SERVICE'
                                    ? "bg-white/60 border-[var(--primary-green)]"
                                    : "bg-white/20 border-white/30 hover:border-[var(--primary-green)]/50"
                            )}
                        >
                            <Tag className={clsx(
                                "h-6 w-6 mb-2",
                                data.type === 'SERVICE' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40"
                            )} />
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">Service</div>
                            <div className="text-[9px] font-bold text-[var(--foreground)]/40 mt-0.5">Non-physical offerings</div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-2">
                            Category
                        </label>
                        <input
                            type="text"
                            value={data.category}
                            onChange={(e) => updateData({ category: e.target.value })}
                            className="w-full h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                            placeholder="General"
                        />
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-2">
                            SKU / Reference ID
                        </label>
                        <input
                            type="text"
                            value={data.sku}
                            onChange={(e) => updateData({ sku: e.target.value })}
                            className="w-full h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                            placeholder="SKU-001"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        className="w-full min-h-[100px] rounded-xl bg-white/50 border border-white/30 p-4 text-sm font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner resize-none placeholder-[var(--foreground)]/20"
                        placeholder="Add item details, specifications, or notes..."
                    />
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary-green)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                    >
                        Continue to Pricing
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
