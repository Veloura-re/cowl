'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Package, Plus, Calculator, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import ErrorModal from '@/components/ui/ErrorModal'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

type AddSalesItemModalProps = {
    isOpen: boolean
    onClose: () => void
    onAdd: (itemData: any) => void
    items: any[]
    initialData?: any
    onDelete?: () => void
    isSale?: boolean
}

export default function AddSalesItemModal({ isOpen, onClose, onAdd, items, initialData, onDelete, isSale = true }: AddSalesItemModalProps) {
    useLockBodyScroll(isOpen)
    const router = useRouter()
    const { formatCurrency } = useBusiness()
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [quantity, setQuantity] = useState<number | string>(1)
    const [rate, setRate] = useState<number | string>('')
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })
    const justSelected = useRef(false)

    useEffect(() => {
        if (initialData) {
            const item = items.find(i => i.id === initialData.itemId)
            setSelectedItem(item || null)
            setQuantity(initialData.quantity || '')
            setRate(initialData.rate || '')
        } else {
            setSelectedItem(null)
            setQuantity('')
            setRate('')
        }
    }, [initialData, isOpen, items])

    useEffect(() => {
        if (selectedItem && !initialData) {
            // Default to Selling Price for Sales, Purchase Price for Purchases
            setRate(isSale ? (selectedItem.selling_price || '') : (selectedItem.purchase_price || ''))
        }
    }, [selectedItem, initialData, isSale])

    const handleSelect = (itemId: string) => {
        const item = items.find(i => i.id === itemId)
        if (item) {
            justSelected.current = true
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
            quantity: Number(quantity) || 0,
            rate: Number(rate) || 0,
            purchasePrice: selectedItem.purchase_price || 0,
            tax: selectedItem.tax_rate || 0,
            amount: (Number(quantity) || 0) * (Number(rate) || 0)
        })

        // Reset and Close
        setSelectedItem(null)
        setQuantity('')
        setRate('')
        onClose()
    }

    if (!isOpen) return null

    // "Picker-First" Flow: If new entry and no item selected, only show the picker
    if (!selectedItem && !initialData) {
        return (
            <PickerModal
                isOpen={isOpen}
                onClose={() => {
                    setIsItemPickerOpen(false)
                    if (!justSelected.current && !selectedItem && !initialData) {
                        onClose()
                    }
                    justSelected.current = false
                }}
                onSelect={handleSelect}
                title="Select Inventory Item"
                options={items.map(i => ({
                    id: i.id,
                    label: i.name.toUpperCase(),
                    subLabel: `${i.stock_quantity ?? 0} ${i.unit ?? 'Units'} available • Cost: ${formatCurrency(i.purchase_price || 0)}`
                }))}
                selectedValue={null}
                action={{
                    label: "Register New Asset",
                    onClick: () => {
                        setIsItemPickerOpen(false)
                        onClose()
                        router.push('/dashboard/inventory/new')
                    },
                    icon: <Plus size={14} />
                }}
                autoFocus
            />
        )
    }

    const numQty = Number(quantity) || 0
    const numRate = Number(rate) || 0
    const total = numQty * numRate
    const purchasePrice = selectedItem?.purchase_price || 0
    const profitPerUnit = numRate - purchasePrice
    const totalProfit = profitPerUnit * numQty
    const isLoss = totalProfit < 0

    return (
        <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center px-4 bg-[var(--modal-backdrop)] backdrop-blur-md animate-in fade-in duration-300 h-[100dvh] pt-[10vh] md:pt-0">
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
                            <h2 className="text-[13px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">{isSale ? 'Sales Entry' : 'Purchase Record'}</h2>
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
                    <div className="relative group">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Inventory Resource *</label>
                        <button
                            type="button"
                            onClick={() => setIsItemPickerOpen(true)}
                            className={clsx(
                                "w-full h-14 flex items-center justify-between rounded-2xl border transition-all text-left px-5 group/btn",
                                selectedItem
                                    ? "bg-[var(--primary-green)]/5 border-[var(--primary-green)]/30 ring-4 ring-[var(--primary-green)]/5"
                                    : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 hover:border-[var(--primary-green)]/50"
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={clsx(
                                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                    selectedItem ? "bg-[var(--primary-green)] text-white" : "bg-[var(--foreground)]/10 text-[var(--foreground)]/30"
                                )}>
                                    <Package className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className={clsx(
                                        "text-[12px] font-black uppercase truncate tracking-tight transition-colors",
                                        selectedItem ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/30"
                                    )}>
                                        {selectedItem ? selectedItem.name : 'Choose Item'}
                                    </p>
                                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">
                                        {selectedItem ? `${selectedItem.stock_quantity ?? 0} in stock • ${isSale ? 'Price' : 'Cost'}: ${formatCurrency(isSale ? selectedItem.selling_price : selectedItem.purchase_price)}` : 'Select from inventory'}
                                    </p>
                                </div>
                            </div>
                            <div className="h-6 w-6 rounded-lg bg-[var(--foreground)]/5 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                <Plus className="h-3 w-3" />
                            </div>
                        </button>
                    </div>

                    {selectedItem && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Quantity */}
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Volume ({selectedItem.unit})</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        autoFocus
                                        value={quantity === 0 ? '' : quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-5 text-[14px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner tabular-nums"
                                    />
                                </div>
                                {/* Rate */}
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Rate / {selectedItem.unit}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={rate === 0 ? '' : rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        className="w-full h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-5 text-[14px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner tabular-nums"
                                    />
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="relative overflow-hidden rounded-[24px] bg-[var(--deep-contrast)] dark:bg-emerald-950/40 p-5 shadow-2xl shadow-[var(--deep-contrast)]/20 border border-white/10">
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-3">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Extended Total</p>
                                            <p className="text-[20px] font-black text-white tabular-nums leading-none tracking-tighter">
                                                {formatCurrency(total)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={clsx(
                                                "text-[8px] font-black uppercase tracking-[0.2em] mb-1",
                                                isSale ? (isLoss ? "text-rose-400" : "text-[var(--primary-green)]") : "text-blue-400"
                                            )}>
                                                {isSale ? (isLoss ? 'Net Deficit' : 'Potential Yield') : 'Inventory Value'}
                                            </p>
                                            <p className={clsx(
                                                "text-[14px] font-black tabular-nums tracking-tighter",
                                                isSale ? (isLoss ? "text-rose-400" : "text-[var(--primary-green)]") : "text-blue-400"
                                            )}>
                                                {isSale ? (isLoss ? '-' : '+') : ''}{formatCurrency(isSale ? Math.abs(totalProfit) : total)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                                        <span>Unit {isSale ? 'Cost' : 'Landed'}: {formatCurrency(purchasePrice)}</span>
                                        {isSale && <span>Margin: {total > 0 ? ((totalProfit / total) * 100).toFixed(1) : 0}%</span>}
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-green)] opacity-[0.03] blur-3xl -mr-16 -mt-16 rounded-full" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-[0.03] blur-3xl -ml-12 -mb-12 rounded-full" />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-2 gap-3">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete()
                                    onClose()
                                }}
                                className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20"
                                title="Remove Entry"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/30 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]/60 transition-all active:scale-95 border border-transparent hover:border-[var(--foreground)]/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedItem || !numQty || numQty <= 0}
                            className="flex-[2] h-12 flex items-center justify-center rounded-2xl bg-[var(--primary-green)] text-white shadow-xl shadow-[var(--primary-green)]/20 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 hover:bg-[var(--primary-hover)] ring-offset-2 focus:ring-2 ring-[var(--primary-green)]"
                        >
                            {initialData ? 'Update Record' : 'Add to Ledger'}
                        </button>
                    </div>
                </form>

                <PickerModal
                    isOpen={isItemPickerOpen}
                    onClose={() => {
                        setIsItemPickerOpen(false)
                        // Only close the parent modal if no selection occurred and we're in "new" mode
                        if (!justSelected.current && !selectedItem && !initialData) {
                            onClose()
                        }
                        justSelected.current = false
                    }}
                    onSelect={handleSelect}
                    title="Select Inventory Item"
                    options={items.map(i => ({
                        id: i.id,
                        label: i.name.toUpperCase(),
                        subLabel: `${i.stock_quantity ?? 0} ${i.unit ?? 'Units'} available • Cost: ${formatCurrency(i.purchase_price || 0)}`
                    }))}
                    selectedValue={selectedItem?.id}
                    action={{
                        label: "Register New Asset",
                        onClick: () => {
                            setIsItemPickerOpen(false)
                            onClose()
                            router.push('/dashboard/inventory/new')
                        },
                        icon: <Plus size={14} />
                    }}
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
