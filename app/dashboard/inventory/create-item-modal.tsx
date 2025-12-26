'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type CreateItemModalProps = {
    isOpen: boolean
    onClose: () => void
}

export default function CreateItemModal({ isOpen, onClose }: CreateItemModalProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        selling_price: 0,
        purchase_price: 0,
        stock_quantity: 0,
        min_stock: 0,
        unit: 'PCS',
        type: 'PRODUCT'
    })

    // Same business logic as Parties (Dev hack: fetch first business)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
            let businessId = businesses?.[0]?.id

            if (!businessId) {
                const { data: newBiz, error: bizError } = await supabase
                    .from('businesses')
                    .insert({ name: 'My Business', owner_id: user.id })
                    .select()
                    .single()
                if (bizError) throw bizError
                businessId = newBiz.id
            }

            const { error } = await supabase.from('items').insert({
                business_id: businessId,
                ...formData,
                selling_price: Number(formData.selling_price),
                purchase_price: Number(formData.purchase_price),
                stock_quantity: Number(formData.stock_quantity),
                min_stock: Number(formData.min_stock)
            })

            if (error) throw error

            onClose()
            router.refresh()
            setFormData({
                name: '',
                sku: '',
                selling_price: 0,
                purchase_price: 0,
                stock_quantity: 0,
                min_stock: 0,
                unit: 'PCS',
                type: 'PRODUCT'
            })
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--surface-highlight)] shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-[var(--surface-highlight)] px-6 py-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Add New Item</h2>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Item Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            placeholder="e.g. Wireless Mouse"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Selling Price</label>
                            <input
                                type="number"
                                value={formData.selling_price}
                                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Purchase Price</label>
                            <input
                                type="number"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opening Stock</label>
                            <input
                                type="number"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Low Stock Alert</label>
                            <input
                                type="number"
                                value={formData.min_stock}
                                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Unit</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            >
                                <option value="PCS">Pieces (PCS)</option>
                                <option value="KG">Kilograms (KG)</option>
                                <option value="LTR">Liters (LTR)</option>
                                <option value="BOX">Box</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">SKU / Code</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-highlight)] hover:text-[var(--text-main)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
