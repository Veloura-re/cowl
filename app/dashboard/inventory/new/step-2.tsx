'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, DollarSign, Package as PackageIcon } from 'lucide-react'
import { useItem } from '@/context/item-context'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import { units } from '@/lib/units'

type Step2Props = {
    onNext: () => void
    onBack: () => void
}

export default function Step2PricingStock({ onNext, onBack }: Step2Props) {
    const { data, updateData } = useItem()
    const { formatCurrency } = useBusiness()
    const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)

    return (
        <div className="glass rounded-[24px] border border-white/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-[var(--primary-green)]/5">
                <h2 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Pricing & Stock</h2>
                <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Set rates and inventory levels</p>
            </div>

            <div className="p-8 space-y-6">
                {/* Unit Selection */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/50 mb-2">
                        Unit of Measurement
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsUnitPickerOpen(true)}
                        className="w-full p-4 rounded-xl bg-white/50 border border-white/30 hover:border-[var(--primary-green)] transition-all text-left flex items-center justify-between"
                    >
                        <div>
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{data.unit}</div>
                            <div className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Selected Unit</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--foreground)]/40" />
                    </button>
                </div>

                {/* Pricing */}
                <div className="glass rounded-2xl border border-white/30 p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-[var(--primary-green)]" />
                        <h3 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Pricing</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selling Price */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/50 mb-2">
                                Selling Price per {data.unit}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={data.selling_price}
                                onChange={(e) => updateData({ selling_price: Number(e.target.value) })}
                                className="w-full h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                            />
                        </div>

                        {/* Purchase Price */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/50 mb-2">
                                Purchase Price per {data.unit}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={data.purchase_price}
                                onChange={(e) => updateData({ purchase_price: Number(e.target.value) })}
                                className="w-full h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Stock Management (Only for Products) */}
                {data.type === 'PRODUCT' && (
                    <div className="glass rounded-2xl border border-white/30 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <PackageIcon className="h-5 w-5 text-[var(--primary-green)]" />
                            <h3 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Stock Management</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Initial Stock */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/50 mb-2">
                                    Initial Stock Quantity
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.stock_quantity}
                                        onChange={(e) => updateData({ stock_quantity: Number(e.target.value) })}
                                        className="flex-1 h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                    />
                                    <span className="text-sm font-bold text-[var(--foreground)]/40">{data.unit}</span>
                                </div>
                            </div>

                            {/* Min Stock Alert */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/50 mb-2">
                                    Low Stock Alert Level
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.min_stock}
                                        onChange={(e) => updateData({ min_stock: Number(e.target.value) })}
                                        className="flex-1 h-12 rounded-xl bg-white/50 border border-white/30 px-4 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                    />
                                    <span className="text-sm font-bold text-[var(--foreground)]/40">{data.unit}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {data.type === 'SERVICE' && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            Stock tracking is disabled for services
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/50 border border-white/30 text-[var(--deep-contrast)] font-bold text-sm uppercase tracking-wider hover:bg-white/20 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary-green)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                >
                    Review Item
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            <PickerModal
                isOpen={isUnitPickerOpen}
                onClose={() => setIsUnitPickerOpen(false)}
                onSelect={(unit) => updateData({ unit })}
                title="Select Unit"
                options={units}
                selectedValue={data.unit}
            />
        </div>
    )
}
