'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type CreatePartyModalProps = {
    isOpen: boolean
    onClose: () => void
}

export default function CreatePartyModal({ isOpen, onClose }: CreatePartyModalProps) {
    const [loading, setLoading] = useState(false)
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

    // Get current user to link business
    // In a real app we'd fetch the active business ID from context/url/state
    // For MVP/Dev, we'll fetch the first business owned by user or fail
    // But wait, we haven't implemented "Create Business" flow yet!
    // The schema requires a business_id.
    // We need a way to create a business first.

    // CRITICAL: We missed "Create Business" step.
    // If user logs in new, they have no business.
    // Parties page needs business_id.

    // I should add logic to auto-create a business if none exists, or prompt user.
    // For now, I'll allow creating a party and let the RLS/Trigger handle it?
    // No, RLS checks business_id.

    // I'll assume for this turn that I will inject a "default business" or similar logic?
    // Or better: I'll fetch the user's business in the Page component and pass it down.
    // If no business, redirect to "Onboarding".

    // Let's implement the form logic first. Ideally we pass `businessId` as prop.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Fetch user's business (Dev hack: get the first one)
            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)

            let businessId = businesses?.[0]?.id

            // Auto-create business if missing (Dev convenience)
            if (!businessId) {
                const { data: newBiz, error: bizError } = await supabase
                    .from('businesses')
                    .insert({ name: 'My Business', owner_id: user.id })
                    .select()
                    .single()

                if (bizError) throw bizError
                businessId = newBiz.id

                // Auto-add member
                await supabase.from('business_members').insert({ business_id: businessId, user_id: user.id, role: 'OWNER' })
            }

            const { error } = await supabase.from('parties').insert({
                business_id: businessId,
                ...formData,
                opening_balance: Number(formData.opening_balance)
            })

            if (error) throw error

            onClose()
            router.refresh()
            // Reset form
            setFormData({
                name: '',
                phone: '',
                email: '',
                type: 'CUSTOMER',
                opening_balance: 0,
                address: '',
                gstin: ''
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
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Add New Party</h2>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Party Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            placeholder="Enter name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                                placeholder="+1 234..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Party Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            >
                                <option value="CUSTOMER">Customer</option>
                                <option value="SUPPLIER">Supplier</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opening Balance</label>
                            <input
                                type="number"
                                value={formData.opening_balance}
                                onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-1">Positive: You gather from them</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email (Optional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                                placeholder="email@example.com"
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
                            Save Party
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
