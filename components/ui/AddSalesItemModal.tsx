'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Package, Plus, Calculator } from 'lucide-react'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import ErrorModal from '@/components/ui/ErrorModal'
import clsx from 'clsx'
import { motion } from 'framer-motion'

type AddSalesItemModalProps = {
    isOpen: boolean
    onClose: () => void
    onAdd: (itemData: any) => void
    items: any[]
    initialData?: any
}

export default function AddSalesItemModal({ isOpen, onClose, onAdd, items, initialData }: AddSalesItemModalProps) {
    const { formatCurrency } = useBusiness()
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [quantity, setQuantity] = useState(1)
    const [rate, setRate] = useState(0)
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    useEffect(() => {
        if (initialData) {
            const item = items.find(i => i.id === initialData.itemId)
            setSelectedItem(item || null)
            setQuantity(initialData.quantity || 1)
            setRate(initialData.rate || 0)
        } else {
            setSelectedItem(null)
            setQuantity(1)
            setRate(0)
        }
    }, [initialData, isOpen, items])

    useEffect(() => {
        if (selectedItem && !initialData) {
            setRate(selectedItem.selling_price || 0)
        }
    }, [selectedItem, initialData])

    const handleSelect = (itemId: string) => {
        const item = items.find(i => i.id === itemId)
        if (item) {
            setSelectedItem(item)
            setIsItemPickerOpen(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selectedItem) return

        onAdd({
            itemId: selectedItem.id,
            name: selectedItem.name,
            unit: selectedItem.unit || 'PCS',
            quantity: quantity,
            rate: rate,
            purchasePrice: selectedItem.purchase_price || 0,
            tax: selectedItem.tax_rate || 0,
            amount: quantity * rate
        })

        // Reset and Close
        setSelectedItem(null)
        setQuantity(1)
        setRate(0)
        onClose()
    }

    if (!isOpen) return null

    const total = quantity * rate
    const purchasePrice = selectedItem?.purchase_price || 0
    const profitPerUnit = rate - purchasePrice
    const totalProfit = profitPerUnit * quantity
    const isLoss = totalProfit < 0

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-[var(--modal-backdrop)] backdrop-blur-md animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative border border-[var(--foreground)]/10"
            >
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary-green)]/20">
                            <Plus className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-[13px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Sales Entry</h2>
                            <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Line Specification</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-500 hover:text-white text-[var(--foreground)]/40 transition-all active:scale-95"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Item Selection */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Inventory Resource *</label>
                        <button
                            type="button"
                            onClick={() => setIsItemPickerOpen(true)}
                            className="w-full h-11 flex items-center justify-between rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all shadow-inner text-left"
                        >
                            <span className="truncate">{selectedItem ? selectedItem.name.toUpperCase() : 'SELECT PRODUCT...'}</span>
                            <Package className="h-4 w-4 opacity-20" />
                        </button>
                    </div>

                    {selectedItem && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-400 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Quantity */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Vol ({selectedItem.unit})</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] transition-all shadow-inner tabular-nums"
                                    />
                                </div>
                                {/* Rate */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Unit Rate ({selectedItem.unit})</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] transition-all shadow-inner tabular-nums"
                                    />
                                </div>
                            </div>

                            {/* Line Total Display */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-[var(--primary-green)]/5 border border-[var(--primary-green)]/20 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 mb-0.5">Line Gross</span>
                                        <span className="text-[13px] font-black text-[var(--primary-green)] tabular-nums">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className={clsx(
                                    "p-3.5 rounded-2xl border shadow-sm",
                                    isLoss ? "bg-rose-500/5 border-rose-500/20" : "bg-blue-500/5 border-blue-500/20"
                                )}>
                                    <div className="flex flex-col">
                                        <span className={clsx("text-[7.5px] font-black uppercase tracking-[0.2em] mb-0.5", isLoss ? "text-rose-600/60" : "text-blue-600/60")}>
                                            {isLoss ? 'Projected Loss' : 'Projected Margin'}
                                        </span>
                                        <span className={clsx(
                                            "text-[13px] font-black tabular-nums",
                                            isLoss ? "text-rose-600" : "text-blue-600"
                                        )}>
                                            {formatCurrency(totalProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 gap-2 border-t border-[var(--primary-green)]/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/30 hover:bg-[var(--foreground)]/5 transition-all active:scale-95"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedItem || quantity <= 0}
                            className="flex-1 h-11 flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] shadow-xl shadow-[var(--deep-contrast)]/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 hover:bg-[var(--deep-contrast-hover)]"
                        >
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            {initialData ? 'Update' : 'Commit'}
                        </button>
                    </div>
                </form>

                <PickerModal
                    isOpen={isItemPickerOpen}
                    onClose={() => setIsItemPickerOpen(false)}
                    onSelect={handleSelect}
                    title="Select Resource"
                    options={items.map(i => ({
                        id: i.id,
                        label: i.name.toUpperCase(),
                        subLabel: `${i.stock_quantity ?? 0} ${i.unit ?? 'Units'} In Stock`
                    }))}
                    selectedValue={selectedItem?.id}
                />

                <ErrorModal
                    isOpen={errorModal.open}
                    onClose={() => setErrorModal({ ...errorModal, open: false })}
                    message={errorModal.message}
                />
            </motion.div>
        </div>
    )
}
