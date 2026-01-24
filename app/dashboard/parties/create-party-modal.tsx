'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, User, Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useBusiness } from '@/context/business-context'
import { useRouter } from 'next/navigation'
import PickerModal from '@/components/ui/PickerModal'
import clsx from 'clsx'

type CreatePartyModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    onDelete?: (id: string) => void
    initialData?: any
}

export default function CreatePartyModal({ isOpen, onClose, onSuccess, onDelete, initialData }: CreatePartyModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm glass rounded-[32px] border border-[var(--foreground)]/10 shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 px-5 py-4 bg-[var(--foreground)]/5">
                    <div>
                        <h2 className="text-[12px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Contact Detail</h2>
                        <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Secure Customer/Supplier Entry</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-500 hover:text-white text-[var(--foreground)]/40 transition-all active:scale-95"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Party Identity *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                placeholder="+123..."
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Business Type</label>
                            <button
                                type="button"
                                onClick={() => setIsTypePickerOpen(true)}
                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[10px] font-black text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                            >
                                <span className="truncate">{formData.type}</span>
                                <Plus className="h-3.5 w-3.5 opacity-20" />
                            </button>
                            <PickerModal
                                isOpen={isTypePickerOpen}
                                onClose={() => setIsTypePickerOpen(false)}
                                onSelect={(type) => setFormData({ ...formData, type })}
                                title="Contact Category"
                                options={[
                                    { id: 'CUSTOMER', label: 'CUSTOMER' },
                                    { id: 'SUPPLIER', label: 'SUPPLIER' }
                                ]}
                                selectedValue={formData.type}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Inaugural Bal</label>
                            <input
                                type="number"
                                value={formData.opening_balance}
                                onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Email (Ops)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-[var(--primary-green)]/10">
                        <div className="flex gap-2">
                            {initialData?.id && onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(initialData.id)}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all active:scale-95"
                                    title="Delete contact"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 transition-all"
                            >
                                Abort
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -1 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-6 py-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                            >
                                {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                Commit
                            </motion.button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
