'use client'

import { useState } from 'react'
import { X, Loader2, Building2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import ErrorModal from '@/components/ui/ErrorModal'

type CreateBusinessModalProps = {
    isOpen: boolean
    onClose: () => void
}

export default function CreateBusinessModal({ isOpen, onClose }: CreateBusinessModalProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const { refreshBusinesses, setActiveBusinessId } = useBusiness()
    const [name, setName] = useState('')
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('businesses')
                .insert({ name, owner_id: user.id })
                .select()
                .single()

            if (error) throw error

            await refreshBusinesses()
            if (data) setActiveBusinessId(data.id)
            onClose()
            setName('')
        } catch (err: any) {
            setErrorModal({ open: true, message: 'Failed to create business: ' + err.message })
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]/80">
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">New Business</h2>
                            <p className="text-xs lg:text-[14px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-1.5">Create Profile</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[var(--foreground)]/5 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs lg:text-[13px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-2 ml-1">Business Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-11 lg:h-9 rounded-xl bg-[var(--foreground)]/5 dark:bg-white/5 border border-[var(--foreground)]/10 dark:border-white/10 px-4 text-sm lg:text-[15px] font-bold text-[var(--deep-contrast)] focus:outline-none transition-all shadow-inner"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    <div className="flex justify-end pt-5 gap-3 border-t border-[var(--foreground)]/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 lg:h-10 rounded-xl text-[15px] lg:text-[14px] font-black uppercase tracking-wider text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/10 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 h-12 lg:h-10 flex items-center justify-center rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg text-[15px] lg:text-[14px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 lg:h-3 lg:w-3 animate-spin" />}
                            Commit Profile
                        </button>
                    </div>
                </form>
            </div>

            <ErrorModal
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ ...errorModal, open: false })}
                message={errorModal.message}
            />
        </div>
    )
}
