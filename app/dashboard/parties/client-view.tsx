'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Phone, User as UserIcon, Trash2, Edit2, Loader2, Printer } from 'lucide-react'
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
    const [visibleCount, setVisibleCount] = useState(50)
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean, message: string, variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' })
    const router = useRouter()
    const supabase = createClient()

    const fetchParties = async () => {
        if (!activeBusinessId) return
        setLoading(true)
        const { data } = await supabase
            .from('parties')
            .select('id, name, type, opening_balance, phone, email, address, business_id')
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
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">People</h1>
                        <p className="text-[10px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">People You Deal With</p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 border border-[var(--primary-foreground)]/10 group"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-300" />
                        Add Person
                    </motion.button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-9 pr-4 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/40"
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
                        typeFilter === 'CUSTOMER'
                            ? "bg-[var(--status-info)] border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50 scale-[1.02]"
                            : "bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--status-info-foreground)]/60">Receivables</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-info-border)] bg-[var(--status-info)] text-[var(--status-info-foreground)] shadow-sm">IN</span>
                    </div>
                    <p className="text-xs font-black text-[var(--status-info-foreground)] mt-1 tabular-nums">
                        {formatCurrency(parties.filter(p => p.type === 'CUSTOMER').reduce((sum, p) => sum + (p.opening_balance || 0), 0))}
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTypeFilter(typeFilter === 'SUPPLIER' ? 'ALL' : 'SUPPLIER')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        typeFilter === 'SUPPLIER'
                            ? "bg-[var(--status-warning)] border-orange-500 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/50 scale-[1.02]"
                            : "bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10",
                        parties.filter(p => p.type === 'SUPPLIER').length > 0 && typeFilter !== 'SUPPLIER' && "critical-glow-amber"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--status-warning-foreground)]/60">Payables</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning)] text-[var(--status-warning-foreground)] shadow-sm">OUT</span>
                    </div>
                    <p className="text-xs font-black text-[var(--status-warning-foreground)] mt-1 tabular-nums">
                        {formatCurrency(Math.abs(parties.filter(p => p.type === 'SUPPLIER').reduce((sum, p) => sum + (p.opening_balance || 0), 0)))}
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredParties.slice(0, visibleCount).map((party) => (
                    <div
                        key={party.id}
                        onClick={(e: React.MouseEvent) => handleEdit(e, party)}
                        className={clsx(
                            "glass-optimized p-1.5 rounded-[10px] border border-[var(--foreground)]/10 group hover:bg-[var(--foreground)]/10 transition-all duration-300 cursor-pointer relative overflow-hidden h-[44px] flex flex-col justify-center",
                            party.opening_balance < -5000 && "critical-glow"
                        )}
                    >
                        {/* Indicator Stripe */}
                        <div className={clsx(
                            "absolute top-0 left-0 w-[2px] h-full transition-colors duration-300",
                            party.opening_balance >= 0 ? "bg-emerald-500" : "bg-rose-500"
                        )} />

                        {/* Header Row - Name & Balance */}
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {/* Avatar */}
                                <div className={clsx(
                                    "h-6 w-6 rounded-lg flex items-center justify-center font-black text-[9px] transition-all duration-300 shadow-inner shrink-0 border uppercase",
                                    party.opening_balance < -5000
                                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                        : "bg-[var(--foreground)]/5 text-[var(--deep-contrast)]/60 border-[var(--foreground)]/10"
                                )}>
                                    {party.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[9px] font-black text-[var(--deep-contrast)] leading-tight uppercase tracking-tight truncate">{party.name}</h3>
                                    <span className={clsx(
                                        "text-[6px] font-black uppercase tracking-widest leading-none",
                                        party.type === 'CUSTOMER' ? "text-blue-500" : "text-orange-500"
                                    )}>{party.type}</span>
                                </div>
                            </div>
                            {/* Balance */}
                            <p className={clsx(
                                "text-[9px] font-black tracking-tight tabular-nums shrink-0 leading-none",
                                party.opening_balance > 0 ? "text-emerald-500" :
                                    party.opening_balance < 0 ? "text-rose-500" : "text-[var(--foreground)]/30"
                            )}>
                                {party.opening_balance > 0 ? '+' : ''}{formatCurrency(party.opening_balance).replace(/^-/, '')}
                            </p>
                        </div>

                        {/* Address & Actions Row */}
                        <div className="flex items-center justify-between gap-1.5 ml-7.5">
                            <p className="text-[6px] font-bold text-[var(--foreground)]/30 truncate flex-1 uppercase tracking-tight">
                                {party.address || 'No location'}
                            </p>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={(e) => handleEdit(e, party)}
                                    className="h-3.5 w-3.5 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-[var(--primary-green)] hover:text-white border border-[var(--foreground)]/10 transition-all"
                                >
                                    <Edit2 size={6} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, party.id)}
                                    className="h-3.5 w-3.5 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-rose-500 hover:text-white border border-[var(--foreground)]/10 transition-all"
                                >
                                    <Trash2 size={6} />
                                </button>
                            </div>
                        </div>
                    </div>

                ))}
            </div>


            {filteredParties.length > visibleCount && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="px-4 py-2 rounded-xl bg-[var(--foreground)]/5 text-[10px] font-black uppercase tracking-wider hover:bg-[var(--foreground)]/10 transition-all"
                    >
                        Load More ({filteredParties.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <LoadingSpinner label="Compiling Directory..." />
                    <p className="text-[8px] font-bold text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-3">Accessing Secure Vault</p>
                </div>
            ) : filteredParties.length === 0 ? (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-300">
                    <UserIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No contacts found</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Add a customer or supplier to get started</p>
                </div>
            ) : null}

            <CreatePartyModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEditingParty(null)
                }}
                onSuccess={() => fetchParties()}
                onDelete={(id) => {
                    setIsCreateModalOpen(false)
                    setConfirmModal({ open: true, partyId: id })
                }}
                initialData={editingParty}
            />

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDelete(confirmModal.partyId)}
                isLoading={isDeleting}
                title="Delete Contact?"
                message="All related records will remain but will lose their link to this contact."
                confirmText="Delete"
                variant="danger"
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
