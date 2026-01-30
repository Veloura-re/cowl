'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle2, Package, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import { units } from '@/lib/units'

export default function CompactItemForm() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
        category: '',
        description: '',
        unit: 'PCS',
        selling_price: 0,
        purchase_price: 0,
        stock_quantity: 0,
        min_stock: 0
    })

    const { activeBusinessId, formatCurrency, setIsGlobalLoading, showSuccess, showError } = useBusiness()



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusinessId) {
            showError('No active business found. Please select or create a business first.')
            return
        }
        if (!formData.name) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
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

            setIsGlobalLoading(false)
            showSuccess(`${formData.name} added to inventory successfully!`)
            router.push('/dashboard/inventory')
            router.refresh()
        } catch (err: any) {
            setIsGlobalLoading(false)
            showError(err.message, 'Save Failed')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center pb-20">
                <div className="glass rounded-2xl border border-white/40 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-bold text-[var(--deep-contrast)] uppercase">Item Added!</h2>
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
                        <h1 className="text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Add Item</h1>
                        <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">New Stock Entry</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/inventory"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/50 border border-white/20 text-[var(--deep-contrast)] text-[9px] font-bold uppercase tracking-wider hover:bg-white/70 transition-all shadow-sm active:scale-95"
                    >
                        <Package className="h-3 w-3" />
                        View Stock
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || !formData.name}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--primary-green)] text-white text-[9px] font-bold uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Basic Info */}
                <div className="glass rounded-xl border border-white/40 p-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Item Details</h3>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Name *</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
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
                                <div className="text-[8px] font-bold text-[var(--deep-contrast)]">Product</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                className={clsx(
                                    "p-2 rounded-lg border transition-all text-left",
                                    formData.type === 'SERVICE' ? "bg-white/60 border-[var(--primary-green)]" : "bg-white/20 border-white/30"
                                )}
                            >
                                <Tag className={clsx("h-4 w-4 mb-1", formData.type === 'SERVICE' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40")} />
                                <div className="text-[8px] font-bold text-[var(--deep-contrast)]">Service</div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-16 rounded-lg bg-white/50 border border-white/20 p-2 text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none resize-none"
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
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Unit</label>
                            <button
                                type="button"
                                onClick={() => setIsUnitPickerOpen(true)}
                                className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold text-left hover:border-[var(--primary-green)] transition-all"
                            >
                                {formData.unit}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Sell / {formData.unit}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.selling_price}
                                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                                    className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Buy / {formData.unit}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                    className="w-full h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                />
                            </div>
                        </div>




                    </div>
                </div>

                {/* Stock */}
                <div className="glass rounded-xl border border-white/40 p-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Stock Count</h3>
                    {formData.type === 'PRODUCT' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Initial Qty</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                                        className="flex-1 h-7 rounded-lg bg-white/50 border border-white/20 px-2 text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                    />
                                    <span className="text-[8px] font-bold text-[var(--foreground)]/40">{formData.unit}</span>
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
        </form>
    )
}
