'use client'

import { useState, useEffect } from 'react'
import { X, Package, Plus, Calculator } from 'lucide-react'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import ErrorModal from '@/components/ui/ErrorModal'

type AddPurchaseItemModalProps = {
    isOpen: boolean
    onClose: () => void
    onAdd: (itemData: any) => void
    items: any[]
    initialData?: any
}

export default function AddPurchaseItemModal({ isOpen, onClose, onAdd, items, initialData }: AddPurchaseItemModalProps) {
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
            setRate(selectedItem.purchase_price || 0)
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
            purchasePrice: rate, // In a purchase, the rate is the cost
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-white/40">
                <div className="flex items-center justify-between border-b border-white/20 bg-white/40 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[var(--primary-green)] text-white shadow-lg">
                            <Plus className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">Add Purchase Item</h2>
                            <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none">Bill Line</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Item Selection */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1.5 ml-1">Select Product *</label>
                        <button
                            type="button"
                            onClick={() => setIsItemPickerOpen(true)}
                            className="w-full h-11 flex items-center justify-between rounded-xl bg-white/50 border border-white/20 px-4 text-[11px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all shadow-inner"
                        >
                            <span className="truncate">{selectedItem ? selectedItem.name : 'Choose an item...'}</span>
                            <Package className="h-4 w-4 opacity-20" />
                        </button>
                    </div>

                    {selectedItem && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Quantity */}
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1.5 ml-1">Quantity ({selectedItem.unit})</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-[13px] font-bold text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] transition-all shadow-inner"
                                    />
                                </div>
                                {/* Rate */}
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1.5 ml-1">Purchase Rate</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-[13px] font-bold text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Line Total Display */}
                            <div className="p-4 rounded-2xl bg-[var(--primary-green)]/5 border border-[var(--primary-green)]/10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-3 w-3 text-[var(--primary-green)]" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60">Line Sum</span>
                                    </div>
                                    <span className="text-sm font-bold text-[var(--primary-green)]">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 gap-2 border-t border-black/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 hover:bg-white/50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedItem || quantity <= 0}
                            className="flex-1 h-11 flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] text-white shadow-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Plus className="mr-2 h-3 w-3" />
                            {initialData ? 'Save Changes' : 'Add to Bill'}
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
            </div>
        </div>
    )
}
