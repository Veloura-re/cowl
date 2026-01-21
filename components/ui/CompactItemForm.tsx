'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle2, Package, Tag, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { units } from '@/lib/units'

type CompactItemFormProps = {
    initialData?: any
}

export default function CompactItemForm({ initialData }: CompactItemFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const isEdit = !!initialData?.id

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        type: (initialData?.type as 'PRODUCT' | 'SERVICE') || 'PRODUCT',
        category: initialData?.category || '',
        description: initialData?.description || '',
        unit: initialData?.unit || 'PCS',
        selling_price: initialData?.selling_price || 0,
        purchase_price: initialData?.purchase_price || 0,
        stock_quantity: initialData?.stock_quantity || 0,
        min_stock: initialData?.min_stock || 0
    })

    const { activeBusinessId } = useBusiness()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusinessId) {
            alert('No active business found.')
            return
        }
        if (!formData.name) return
        setLoading(true)

        try {
            if (isEdit) {
                // Update
                const { error } = await supabase
                    .from('items')
                    .update({
                        name: formData.name,
                        sku: formData.sku,
                        type: formData.type,
                        category: formData.category,
                        description: formData.description,
                        unit: formData.unit,
                        selling_price: formData.selling_price,
                        purchase_price: formData.purchase_price,
                        // Only update stock if it's a product. 
                        // Note: Validating if we should allow direct stock edit here or only via adjustments?
                        // For now, let's allow editing basic info. Stock quantity usually should be adjusted via transactions,
                        // but if fixing an error, direct edit might be needed.
                        stock_quantity: formData.type === 'PRODUCT' ? formData.stock_quantity : 0,
                        min_stock: formData.type === 'PRODUCT' ? formData.min_stock : 0
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase.from('items').insert({
                    business_id: activeBusinessId,
                    name: formData.name,
                    sku: formData.sku,
                    type: formData.type,
                    category: formData.category,
                    description: formData.description,
                    unit: formData.unit,
                    selling_price: formData.selling_price,
                    purchase_price: formData.purchase_price,
                    stock_quantity: formData.type === 'PRODUCT' ? formData.stock_quantity : 0,
                    min_stock: formData.type === 'PRODUCT' ? formData.min_stock : 0
                })

                if (error) throw error
            }

            setSuccess(true)
            router.refresh()
            setTimeout(() => setSuccess(false), 2000)
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!initialData?.id) return
        setDeleting(true)
        try {
            const { error } = await supabase.from('items').delete().eq('id', initialData.id)
            if (error) throw error
            setSuccess(true)
            router.refresh()
            setTimeout(() => setSuccess(false), 2000)
        } catch (err: any) {
            alert('Error deleting item: ' + err.message)
        } finally {
            setDeleting(false)
            setIsConfirmOpen(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center pb-20">
                <div className="glass rounded-2xl border border-white/40 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-bold text-[var(--deep-contrast)] uppercase">Item {isEdit ? 'Updated' : 'Added'}!</h2>
                    <p className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase mt-1">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-4xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/inventory" className="p-1 rounded-lg bg-white/50 border border-white/10 hover:bg-[var(--primary-green)] hover:text-white transition-all">
                        <ArrowLeft className="h-3 w-3" />
                    </Link>
                    <div>
                        <h1 className="text-[12px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">{isEdit ? 'Edit Item' : 'New Item'}</h1>
                        <p className="text-[10px] lg:text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-1">Inventory {isEdit ? 'Update' : 'Entry'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-xl bg-rose-50 text-rose-500 text-[11px] lg:text-[9px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 className="h-4 w-4 lg:h-3 lg:w-3" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !formData.name}
                        className="flex items-center gap-1.5 px-5 py-2 lg:px-4 lg:py-1.5 rounded-xl bg-[var(--primary-green)] text-white text-[11px] lg:text-[9px] font-bold uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                        {loading ? <Loader2 className="h-4 w-4 lg:h-3 lg:w-3 animate-spin" /> : <Save className="h-4 w-4 lg:h-3 lg:w-3" />}
                        {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Basic Info */}
                <div className="glass rounded-xl border border-white/40 p-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Basic Information</h3>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Name *</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                placeholder="e.g., Premium Cotton"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'PRODUCT' })}
                                className={clsx(
                                    "p-2 rounded-lg border transition-all text-left",
                                    formData.type === 'PRODUCT' ? "bg-white/60 border-[var(--primary-green)]" : "bg-white/20 border-white/30"
                                )}
                            >
                                <Package className={clsx("h-4 w-4 mb-1", formData.type === 'PRODUCT' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40")} />
                                <div className="text-[10px] lg:text-[8px] font-bold text-[var(--deep-contrast)]">Product</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                className={clsx(
                                    "p-3 lg:p-2 rounded-lg border transition-all text-left",
                                    formData.type === 'SERVICE' ? "bg-white/60 border-[var(--primary-green)]" : "bg-white/20 border-white/30"
                                )}
                            >
                                <Tag className={clsx("h-5 w-5 lg:h-4 lg:w-4 mb-1", formData.type === 'SERVICE' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40")} />
                                <div className="text-[10px] lg:text-[8px] font-bold text-[var(--deep-contrast)]">Service</div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-24 lg:h-16 rounded-lg bg-white/50 border border-white/20 p-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none resize-none"
                                placeholder="Item details..."
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="glass rounded-xl border border-white/40 p-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Pricing</h3>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Unit</label>
                            <button
                                type="button"
                                onClick={() => setIsUnitPickerOpen(true)}
                                className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold text-left hover:border-[var(--primary-green)] transition-all"
                            >
                                {formData.unit}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Sell / {formData.unit}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.selling_price}
                                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                                    className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Buy / {formData.unit}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                    className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock */}
                <div className="glass rounded-xl border border-white/40 p-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Stock</h3>
                    {formData.type === 'PRODUCT' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Current Qty</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                                        className="flex-1 h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                    />
                                    <span className="text-[10px] lg:text-[8px] font-bold text-[var(--foreground)]/40">{formData.unit}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Alert Level</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.min_stock}
                                        onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                                        className="flex-1 h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                    />
                                    <span className="text-[8px] font-bold text-[var(--foreground)]/40">{formData.unit}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                            <p className="text-[8px] font-bold text-blue-600 uppercase">Stock tracking disabled for services</p>
                        </div>
                    )}
                </div>
            </div>

            <PickerModal
                isOpen={isUnitPickerOpen}
                onClose={() => setIsUnitPickerOpen(false)}
                onSelect={(unit) => setFormData({ ...formData, unit })}
                title="Select Unit"
                options={units}
                selectedValue={formData.unit}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title="Delete Item?"
                message="Are you sure you want to delete this item? This cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </form>
    )
}
