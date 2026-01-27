'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle2, Package, Tag, Trash2, Box, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { units } from '@/lib/units'
import { motion, AnimatePresence } from 'framer-motion'

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
    const [showMore, setShowMore] = useState(false)

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
        if (!activeBusinessId) return
        if (!formData.name) return
        setLoading(true)

        try {
            if (isEdit) {
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
                        stock_quantity: formData.type === 'PRODUCT' ? formData.stock_quantity : 0,
                        min_stock: formData.type === 'PRODUCT' ? formData.min_stock : 0
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
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
            setTimeout(() => {
                setSuccess(false)
                router.push('/dashboard/inventory')
            }, 1000)
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
            setTimeout(() => {
                setSuccess(false)
                router.push('/dashboard/inventory')
            }, 1000)
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
                <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-8 text-center shadow-2xl">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-black text-[var(--deep-contrast)] uppercase tracking-tight">Product {isEdit ? 'Modified' : 'Registered'}</h2>
                    <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-1">Executing Sync...</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/inventory" className="p-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xs font-black text-[var(--deep-contrast)] uppercase tracking-tight">{isEdit ? 'Modify Resource' : 'Register Resource'}</h1>
                        <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Inventory Specification</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 lg:py-1.5 rounded-xl bg-rose-500/5 text-rose-500 text-[11px] lg:text-[9px] font-black uppercase tracking-wider hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 className="h-4 w-4 lg:h-3 lg:w-3" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !formData.name}
                        className="flex items-center gap-1.5 px-5 py-2 lg:px-4 lg:py-1.5 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[11px] lg:text-[9px] font-black uppercase tracking-wider hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                    >
                        {loading ? <Loader2 className="h-4 w-4 lg:h-3 lg:w-3 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update' : 'Commit'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 shadow-lg">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-4 border-b border-[var(--foreground)]/5 pb-2">Core Specification</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Label Identity *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                    placeholder="Enter resource name..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'PRODUCT' })}
                                    className={clsx(
                                        "p-3 rounded-2xl border transition-all text-left group",
                                        formData.type === 'PRODUCT' ? "bg-[var(--primary-green)]/10 border-[var(--primary-green)] shadow-lg shadow-[var(--primary-green)]/10" : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10"
                                    )}
                                >
                                    <Box className={clsx("h-5 w-5 mb-2", formData.type === 'PRODUCT' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/40")} />
                                    <div className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Physical Asset</div>
                                    <div className="text-[7px] font-black text-[var(--foreground)]/30 uppercase tracking-widest mt-0.5">Stock Controlled</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                    className={clsx(
                                        "p-3 rounded-2xl border transition-all text-left group",
                                        formData.type === 'SERVICE' ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10" : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10"
                                    )}
                                >
                                    <Layers className={clsx("h-5 w-5 mb-2", formData.type === 'SERVICE' ? "text-blue-500" : "text-[var(--foreground)]/40")} />
                                    <div className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Service Log</div>
                                    <div className="text-[7px] font-black text-[var(--foreground)]/30 uppercase tracking-widest mt-0.5">Intangible Value</div>
                                </button>
                            </div>

                        </div>
                    </div>
                    {/* Bottom Documentation / More Options - Moved under core spec */}
                    <div className="pt-2">
                        <div className="flex justify-start ml-2">
                            <button
                                type="button"
                                onClick={() => setShowMore(!showMore)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/60 transition-all border border-[var(--foreground)]/10 shadow-sm"
                            >
                                {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {showMore ? 'Less Options' : 'More Options'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showMore && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                                    className="overflow-hidden mt-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 shadow-lg space-y-4">
                                            <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 border-b border-[var(--foreground)]/5 pb-2">Identification</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Classification</label>
                                                    <input
                                                        type="text"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] transition-all shadow-inner"
                                                        placeholder="Category..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Registry SKU</label>
                                                    <input
                                                        type="text"
                                                        value={formData.sku}
                                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] transition-all shadow-inner"
                                                        placeholder="Stock code..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 shadow-lg">
                                            <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 border-b border-[var(--foreground)]/5 pb-2">Resource Memorandum</h3>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full h-[68px] rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-3 text-[11px] font-black text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all resize-none shadow-inner"
                                                placeholder="Enter internal details..."
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Vertical Sidebar */}
                <div className="space-y-4">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 shadow-lg">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-4 border-b border-[var(--foreground)]/5 pb-2">Financials</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Measurement Unit</label>
                                <button
                                    type="button"
                                    onClick={() => setIsUnitPickerOpen(true)}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[10px] font-black text-left hover:border-[var(--primary-green)] transition-all flex items-center justify-between"
                                >
                                    <span>{formData.unit}</span>
                                    <div className="px-2 py-0.5 rounded-lg bg-[var(--foreground)]/5 text-[7px] border border-[var(--foreground)]/10 uppercase">Select</div>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Sales Valuation / {formData.unit}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.selling_price || ''}
                                        onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                                        className="w-full h-11 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-4 text-[14px] font-black text-[var(--primary-green)] focus:border-emerald-500 focus:outline-none transition-all tabular-nums text-center shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Cost Valuation / {formData.unit}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.purchase_price || ''}
                                        onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                        className="w-full h-11 rounded-xl bg-rose-500/5 border border-rose-500/10 px-4 text-[11px] font-black text-rose-500 focus:border-rose-500 transition-all tabular-nums text-center shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 shadow-lg">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-4 border-b border-[var(--foreground)]/5 pb-2">Inventory Control</h3>
                        {formData.type === 'PRODUCT' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Active Stock Volume</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.stock_quantity || ''}
                                            onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                                            className="flex-1 h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] text-right focus:border-[var(--primary-green)] transition-all shadow-inner tabular-nums"
                                        />
                                        <span className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest">{formData.unit}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Critical Threshold</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.min_stock || ''}
                                            onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                                            className="flex-1 h-11 rounded-xl bg-orange-500/5 border border-orange-500/20 px-4 text-[13px] font-black text-orange-600 text-right focus:border-orange-500 transition-all shadow-inner tabular-nums"
                                        />
                                        <span className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest">{formData.unit}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center flex flex-col items-center">
                                <Layers className="h-6 w-6 text-blue-500/40 mb-2" />
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Stock metrics bypassed for intangible logs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PickerModal
                isOpen={isUnitPickerOpen}
                onClose={() => setIsUnitPickerOpen(false)}
                onSelect={(unit) => setFormData({ ...formData, unit })}
                title="Select Scale"
                options={units}
                selectedValue={formData.unit}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title="Purge Resource?"
                message="Irreversibly delete this item from the central registry? All historical data will be decoupled."
                confirmText="Purge"
                variant="danger"
            />
        </form>
    )
}
