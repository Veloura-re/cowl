'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Phone, User as UserIcon, Trash2, Edit2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CreatePartyModal from './create-party-modal'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import ConfirmModal from '@/components/ui/ConfirmModal'
import FeedbackModal from '@/components/ui/FeedbackModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function PartiesClientView() {
    const { activeBusinessId, formatCurrency } = useBusiness()
    const [parties, setParties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingParty, setEditingParty] = useState<any>(null)
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, partyId: string }>({ open: false, partyId: '' })
    const [isDeleting, setIsDeleting] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL')
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean, message: string, variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' })
    const router = useRouter()
    const supabase = createClient()

    const fetchParties = async () => {
        if (!activeBusinessId) return
        setLoading(true)
        const { data } = await supabase
            .from('parties')
            .select('*')
            .eq('business_id', activeBusinessId)
            .order('name')
        if (data) setParties(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchParties()
    }, [activeBusinessId])

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setConfirmModal({ open: true, partyId: id })
    }

    const executeDelete = async (id: string) => {
        setIsDeleting(true)
        try {
            const { error } = await supabase.from('parties').delete().eq('id', id)
            if (error) throw error
            setParties(parties.filter(p => p.id !== id))
            setFeedbackModal({ open: true, message: 'Party deleted successfully.', variant: 'success' })
            setConfirmModal({ open: false, partyId: '' })
            router.refresh()
        } catch (err: any) {
            setFeedbackModal({ open: true, message: 'Failed to delete party: ' + err.message, variant: 'error' })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEdit = (e: React.MouseEvent, party: any) => {
        e.stopPropagation()
        setEditingParty(party)
        setIsCreateModalOpen(true)
    }

    const filteredParties = parties.filter((party) =>
        party.business_id === activeBusinessId && (
            party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            party.phone?.includes(searchQuery)
        ) && (typeFilter === 'ALL' || party.type === typeFilter)
    )

    return (
        <div className="space-y-4 pb-20">
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Parties</h1>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Customers & Suppliers</p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-indigo-600 transition-all shadow-xl shadow-[var(--deep-contrast)]/20 active:scale-95 border border-white/10 group"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                        Add Party
                    </motion.button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                    <input
                        type="text"
                        placeholder="Search parties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 rounded-xl bg-white/50 border border-white/20 pl-9 pr-4 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/30"
                    />
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex gap-2">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTypeFilter(typeFilter === 'CUSTOMER' ? 'ALL' : 'CUSTOMER')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        typeFilter === 'CUSTOMER' ? "bg-blue-500/10 border-blue-500/50" : "border-white/40 hover:bg-white/60"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-600/60">Receivables</span>
                        </div>
                        <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-tighter">IN</span>
                    </div>
                    <p className="text-sm font-black text-blue-600 mt-1 tabular-nums">
                        {formatCurrency(parties.filter(p => p.type === 'CUSTOMER').reduce((sum, p) => sum + (p.opening_balance || 0), 0))}
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTypeFilter(typeFilter === 'SUPPLIER' ? 'ALL' : 'SUPPLIER')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        typeFilter === 'SUPPLIER' ? "bg-orange-500/10 border-orange-500/50" : "border-white/40 hover:bg-white/60"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-600/60">Payables</span>
                        </div>
                        <span className="text-[8px] font-bold text-orange-600 bg-orange-50 px-1 rounded uppercase tracking-tighter">OUT</span>
                    </div>
                    <p className="text-sm font-black text-orange-600 mt-1 tabular-nums">
                        {formatCurrency(Math.abs(parties.filter(p => p.type === 'SUPPLIER').reduce((sum, p) => sum + (p.opening_balance || 0), 0)))}
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredParties.map((party) => (
                    <motion.div
                        key={party.id}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e: React.MouseEvent) => handleEdit(e, party)}
                        className="glass p-2 rounded-[14px] group hover:bg-white/80 transition-all duration-300 border border-white/50 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[70px]"
                    >
                        {/* Status/Type pill absolute */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <UserIcon className={clsx(
                                    "h-2.5 w-2.5 shrink-0",
                                    party.type === 'CUSTOMER' ? "text-blue-600" : "text-orange-600"
                                )} />
                                <h3 className="text-[10px] font-black text-[var(--deep-contrast)] truncate">{party.name}</h3>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, party.id)}
                                className="h-5 w-5 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white border border-rose-100 shrink-0"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>

                        <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between">
                            <p className={clsx(
                                "text-[9px] font-black tracking-tighter",
                                party.opening_balance > 0 ? "text-emerald-600" :
                                    party.opening_balance < 0 ? "text-rose-600" : "text-[var(--foreground)]/30"
                            )}>
                                {party.opening_balance > 0 ? '+' : ''}{formatCurrency(party.opening_balance).replace(/^-/, '')}
                            </p>
                            <span className="text-[6px] font-bold text-[var(--foreground)]/40 uppercase tracking-tighter">
                                {party.phone ? party.phone.slice(-4) : party.type.slice(0, 4)}
                            </span>
                        </div>

                        {/* Subtle Phone Indicator */}
                        <div className="mt-2 pt-2 border-t border-black/5 flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Phone size={10} />
                            <span className="text-[9px] font-bold">{party.phone || 'No phone'}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {loading ? (
                <div className="py-20">
                    <LoadingSpinner label="Fetching Parties..." />
                </div>
            ) : filteredParties.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <p className="text-xs font-medium">No parties found</p>
                </div>
            ) : null}

            <CreatePartyModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEditingParty(null)
                }}
                onSuccess={() => window.location.reload()}
                initialData={editingParty}
            />

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDelete(confirmModal.partyId)}
                isLoading={isDeleting}
                title="Delete Party?"
                message="All related invoices will remain but will lose their customer link."
                confirmText="Delete"
                cancelText="Keep"
            />

            <FeedbackModal
                isOpen={feedbackModal.open}
                onClose={() => setFeedbackModal({ ...feedbackModal, open: false })}
                message={feedbackModal.message}
                variant={feedbackModal.variant}
            />
        </div>
    )
}
