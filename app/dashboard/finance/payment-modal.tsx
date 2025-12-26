'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type PaymentModalProps = {
    isOpen: boolean
    onClose: () => void
    type: 'RECEIPT' | 'PAYMENT'
}

export default function PaymentModal({ isOpen, onClose, type }: PaymentModalProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const [parties, setParties] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        party_id: '',
        amount: 0,
        mode: 'CASH',
        date: new Date().toISOString().split('T')[0],
        description: ''
    })

    useEffect(() => {
        if (isOpen) {
            // Fetch parties (Optimized: only if open)
            const fetchParties = async () => {
                const { data } = await supabase
                    .from('parties')
                    .select('id, name')
                    .order('name')
                if (data) setParties(data)
            }
            fetchParties()
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
            const businessId = businesses?.[0]?.id

            const { error } = await supabase.from('transactions').insert({
                business_id: businessId,
                party_id: formData.party_id || null, // Optional for expense?
                amount: Number(formData.amount),
                type: type,
                mode: formData.mode,
                date: formData.date,
                description: formData.description
            })

            if (error) throw error

            // TODO: Update Party Balance (Trigger or Manual)

            onClose()
            router.refresh()
            setFormData({
                party_id: '',
                amount: 0,
                mode: 'CASH',
                date: new Date().toISOString().split('T')[0],
                description: ''
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
                    <h2 className="text-xl font-bold text-[var(--text-main)]">
                        Record {type === 'RECEIPT' ? 'Money In' : 'Money Out'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Party (Optional)</label>
                        <select
                            value={formData.party_id}
                            onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                            className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                        >
                            <option value="">Select Party</option>
                            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Amount</label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mode</label>
                            <select
                                value={formData.mode}
                                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            >
                                <option value="CASH">Cash</option>
                                <option value="BANK">Bank</option>
                                <option value="ONLINE">Online</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description / Notes</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            placeholder="e.g. Utility Bill"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                        />
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
                            Save Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
