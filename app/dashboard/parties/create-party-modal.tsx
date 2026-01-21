'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useBusiness } from '@/context/business-context'
import { useRouter } from 'next/navigation'
import PickerModal from '@/components/ui/PickerModal'

type CreatePartyModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    initialData?: any
}

export default function CreatePartyModal({ isOpen, onClose, onSuccess, initialData }: CreatePartyModalProps) {
    const [loading, setLoading] = useState(false)
    const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        type: 'CUSTOMER',
        opening_balance: 0,
        address: '',
        gstin: ''
    })

    const { activeBusinessId } = useBusiness()

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                type: initialData.type || 'CUSTOMER',
                opening_balance: initialData.opening_balance || 0,
                address: initialData.address || '',
                gstin: initialData.gstin || ''
            })
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                type: 'CUSTOMER',
                opening_balance: 0,
                address: '',
                gstin: ''
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusinessId) return
        setLoading(true)

        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from('parties')
                    .update({
                        ...formData,
                        opening_balance: Number(formData.opening_balance)
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase.from('parties').insert({
                    ...formData,
                    business_id: activeBusinessId,
                    opening_balance: Number(formData.opening_balance)
                })

                if (error) throw error
            }

            if (onSuccess) onSuccess()
            onClose()
            router.refresh()
            if (!initialData) {
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    type: 'CUSTOMER',
                    opening_balance: 0,
                    address: '',
                    gstin: ''
                })
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm glass rounded-[24px] border border-white/40 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/40">
                    <div>
                        <h2 className="text-xs font-bold text-[var(--deep-contrast)] uppercase tracking-wider">Add New Party</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-tighter">Business Contact</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-[var(--foreground)]/40 transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1 ml-1">Party Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1 ml-1">Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                placeholder="+123..."
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1 ml-1">Type</label>
                            <button
                                type="button"
                                onClick={() => setIsTypePickerOpen(true)}
                                className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                            >
                                <span className="truncate">{formData.type}</span>
                            </button>
                            <PickerModal
                                isOpen={isTypePickerOpen}
                                onClose={() => setIsTypePickerOpen(false)}
                                onSelect={(type) => setFormData({ ...formData, type })}
                                title="Party Type"
                                options={[
                                    { id: 'CUSTOMER', label: 'Customer' },
                                    { id: 'SUPPLIER', label: 'Supplier' }
                                ]}
                                selectedValue={formData.type}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1 ml-1">Opening Bal</label>
                            <input
                                type="number"
                                value={formData.opening_balance}
                                onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                                className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1 ml-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-3 gap-2 border-t border-[var(--primary-green)]/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 hover:bg-white/40 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-4 py-1.5 rounded-xl bg-[var(--deep-contrast)] text-white text-[9px] font-bold uppercase tracking-wider hover:bg-[var(--primary-green)] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[var(--deep-contrast)]/10"
                        >
                            {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Save Party
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
