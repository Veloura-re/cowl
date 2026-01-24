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

    const handleQuantityChange = (index: number, quantity: number) => {
        const item = data.items[index]
        const amount = quantity * item.rate
        updateItem(index, { quantity, amount })
    }

    const handleRateChange = (index: number, rate: number) => {
        const item = data.items[index]
        const amount = item.quantity * rate
        updateItem(index, { rate, amount })
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
        <div className="glass rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-[var(--primary-green)]/5 flex justify-between items-center">
                <div>
                    <h2 className="text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Add Line Items</h2>
                    <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-0.5">Select products and specify quantities</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary-green)] text-white font-bold text-[9px] uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                >
                    <Plus className="h-3 w-3" />
                    Add Item
                </button>
            </div>

            <div className="p-4 space-y-3 min-h-[300px]">
                {data.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                        <Package className="h-10 w-10 mb-3" />
                        <p className="text-[9px] font-bold uppercase tracking-wider">No items added yet</p>
                        <p className="text-[8px] font-bold text-[var(--foreground)]/40 mt-1">Click "Add Item" to get started</p>
                    </div>
                ) : (
                    data.items.map((item, index) => (
                        <div key={index} className="group relative glass p-3 rounded-xl border border-white/30 hover:bg-white/60 transition-all">
                            {/* Remove Button */}
                            <button
                                onClick={() => removeItem(index)}
                                className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Item Name */}
                            <div className="mb-2">
                                <div className="text-[11px] font-bold text-[var(--deep-contrast)]">{item.name}</div>
                                <div className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Stock Item</div>
                            </div>

                            {/* Quantity, Rate, Amount Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Quantity × Unit */}
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2">
                                        Quantity × {item.unit}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                            className="w-full h-10 rounded-xl bg-white/50 border border-white/30 px-3 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase">× {item.unit}</span>
                                    </div>
                                </div>

                                {/* Rate per Unit */}
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2">
                                        Rate per {item.unit}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={item.rate}
                                            onChange={(e) => handleRateChange(index, Number(e.target.value))}
                                            className="w-full h-10 rounded-xl bg-white/50 border border-white/30 px-3 text-sm font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase">/ {item.unit}</span>
                                    </div>
                                </div>

                                {/* Line Total */}
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2">
                                        Line Total
                                    </label>
                                    <div className="h-10 flex items-center justify-end px-3 rounded-xl bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20">
                                        <span className="text-sm font-bold text-[var(--primary-green)]">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tax Info */}
                            {item.tax > 0 && (
                                <div className="mt-2 text-[9px] font-bold text-[var(--foreground)]/40">
                                    Tax: {item.tax}% • {formatCurrency((item.amount * item.tax) / 100)}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {error && (
                    <p className="text-[9px] font-bold text-red-500 text-center">{error}</p>
                )}
            </div>

            {/* Subtotal */}
            {data.items.length > 0 && (
                <div className="px-6 py-4 border-t border-white/10 bg-white/20">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">Subtotal ({data.items.length} items)</span>
                        <span className="text-lg font-bold text-[var(--deep-contrast)]">{formatCurrency(subtotal)}</span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/50 border border-white/30 text-[var(--deep-contrast)] font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary-green)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                >
                    Review Invoice
                    <ArrowRight className="h-4 w-4" />
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
