'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, TrendingUp, TrendingDown, Receipt, ArrowRightLeft, Search, Filter, ArrowUpDown, Trash2, Edit2, Calendar, Printer } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import UnifiedControlBar from '@/components/ui/UnifiedControlBar'

export default function FinanceClientView({ initialTransactions }: { initialTransactions?: any[] }) {
    const router = useRouter()
    const { activeBusinessId, formatCurrency, isLoading: isContextLoading, setIsGlobalLoading, showSuccess, showError } = useBusiness()
    const [transactions, setTransactions] = useState(initialTransactions || [])
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('ALL')
    const [modeFilter, setModeFilter] = useState<string>('ALL')
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'party'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, transactionId: string }>({ open: false, transactionId: '' })
    const [isDeleting, setIsDeleting] = useState(false)
    const [loading, setLoading] = useState(!initialTransactions)
    const [isSortPickerOpen, setIsSortPickerOpen] = useState(false)
    const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!activeBusinessId) {
                setLoading(false)
                return
            }
            setLoading(true)
            const { data, error } = await supabase
                .from('transactions')
                .select('id, amount, date, type, mode, description, party:parties(name)')
                .eq('business_id', activeBusinessId)
                .order('date', { ascending: false })
                .limit(100)
            if (error) {
                console.error('FinanceClientView: Error fetching transactions', error)
            }
            if (data) setTransactions(data)
            setLoading(false)
        }
        fetchTransactions()
    }, [activeBusinessId])

    // Real-time Subscription
    useEffect(() => {
        if (!activeBusinessId) return

        const channel = supabase
            .channel(`finance_${activeBusinessId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `business_id=eq.${activeBusinessId}`
                },
                async (payload) => {
                    const data = (payload.new || payload.old) as any

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        let partyData = null
                        if (data.party_id) {
                            const { data: p } = await supabase
                                .from('parties')
                                .select('name')
                                .eq('id', data.party_id)
                                .single()
                            partyData = p
                        }

                        const updatedTransaction = {
                            ...data,
                            party: partyData ? { name: partyData.name } : null
                        }

                        if (payload.eventType === 'INSERT') {
                            setTransactions(prev => [updatedTransaction, ...prev])
                        } else {
                            setTransactions(prev => prev.map(t => t.id === data.id ? { ...t, ...updatedTransaction } : t))
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setTransactions(prev => prev.filter(t => t.id === payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeBusinessId, supabase])

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setConfirmModal({ open: true, transactionId: id })
    }

    const executeDelete = async (id: string) => {
        setIsDeleting(true)
        setIsGlobalLoading(true)
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id)
            if (error) throw error
            setTransactions(transactions.filter(t => t.id !== id))
            showSuccess('Transaction removed from ledger.')
            setConfirmModal({ open: false, transactionId: '' })
        } catch (err: any) {
            showError('Failed to delete transaction: ' + err.message)
        } finally {
            setIsDeleting(false)
            setIsGlobalLoading(false)
        }
    }

    const handleEdit = (e: React.MouseEvent, transaction: any) => {
        e.stopPropagation()
        router.push(`/dashboard/finance/edit?id=${transaction.id}`)
    }

    const businessTransactions = transactions || []

    // Mode-specific calculations
    const cashIn = businessTransactions.filter(t => t.type === 'RECEIPT' && t.mode === 'CASH').reduce((acc, t) => acc + t.amount, 0)
    const cashOut = businessTransactions.filter(t => t.type === 'PAYMENT' && t.mode === 'CASH').reduce((acc, t) => acc + t.amount, 0)
    const cashBalance = cashIn - cashOut

    const bankIn = businessTransactions.filter(t => t.type === 'RECEIPT' && t.mode === 'BANK').reduce((acc, t) => acc + t.amount, 0)
    const bankOut = businessTransactions.filter(t => t.type === 'PAYMENT' && t.mode === 'BANK').reduce((acc, t) => acc + t.amount, 0)
    const bankBalance = bankIn - bankOut

    const onlineIn = businessTransactions.filter(t => t.type === 'RECEIPT' && t.mode === 'ONLINE').reduce((acc, t) => acc + t.amount, 0)
    const onlineOut = businessTransactions.filter(t => t.type === 'PAYMENT' && t.mode === 'ONLINE').reduce((acc, t) => acc + t.amount, 0)
    const onlineBalance = onlineIn - onlineOut

    const totalIncome = businessTransactions.filter(t => t.type === 'RECEIPT').reduce((acc, t) => acc + t.amount, 0)
    const totalExpenses = businessTransactions.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0)
    const netBalance = totalIncome - totalExpenses

    let filteredTransactions = businessTransactions.filter((t) =>
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.party?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (typeFilter === 'ALL' || t.type === typeFilter) &&
        (modeFilter === 'ALL' || t.mode === modeFilter)
    )

    // Sort
    filteredTransactions = [...filteredTransactions].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1
        if (sortBy === 'date') {
            return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
        } else if (sortBy === 'amount') {
            return multiplier * (a.amount - b.amount)
        } else {
            const nameA = a.party?.name || a.description || ''
            const nameB = b.party?.name || b.description || ''
            return multiplier * nameA.localeCompare(nameB)
        }
    })

    const incomePercent = totalIncome > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 0

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Finances</h1>
                        <p className="text-[14px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Money Record</p>
                    </div>
                    <div id="finance-actions" className="flex gap-2">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard/finance/new?type=RECEIPT')}
                            className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-4 py-2 text-[15px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 border border-[var(--primary-foreground)]/10 group"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                            <span>Received</span>
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard/finance/new?type=PAYMENT')}
                            className="flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-[15px] font-black uppercase tracking-wider text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 border border-white/10 group"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                            <span>Paid</span>
                        </motion.button>
                    </div>
                </div>

                <UnifiedControlBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSortClick={() => setIsSortPickerOpen(true)}
                    onFilterClick={() => setIsTypePickerOpen(true)}
                />
            </div>

            {/* Quick Modes Bar */}
            <div id="finance-modes" className="grid grid-cols-3 gap-2">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModeFilter(modeFilter === 'CASH' ? 'ALL' : 'CASH')}
                    className={clsx(
                        "glass p-3.5 rounded-2xl border bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm cursor-pointer transition-all",
                        modeFilter === 'CASH'
                            ? "border-[var(--primary-green)] ring-2 ring-[var(--primary-green)]/30 scale-[1.02] shadow-lg shadow-[var(--primary-green)]/10"
                            : "border-[var(--foreground)]/10"
                    )}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-10 w-10 text-[var(--primary-green)]" />
                    </div>
                    <div className="relative z-10">
                        <span className={clsx(
                            "text-[12px] font-black uppercase tracking-widest transition-colors",
                            modeFilter === 'CASH' ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/30"
                        )}>Cash</span>
                        <h2 className="text-[22px] font-black text-[var(--deep-contrast)] mt-1 tabular-nums">{formatCurrency(cashBalance)}</h2>
                    </div>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModeFilter(modeFilter === 'BANK' ? 'ALL' : 'BANK')}
                    className={clsx(
                        "glass p-3.5 rounded-2xl border bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm cursor-pointer transition-all",
                        modeFilter === 'BANK'
                            ? "border-blue-500 ring-2 ring-blue-500/30 scale-[1.02] shadow-lg shadow-blue-500/10"
                            : "border-[var(--foreground)]/10"
                    )}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-10 w-10 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <span className={clsx(
                            "text-[12px] font-black uppercase tracking-widest transition-colors",
                            modeFilter === 'BANK' ? "text-blue-500" : "text-[var(--foreground)]/30"
                        )}>Bank</span>
                        <h2 className="text-[22px] font-black text-[var(--deep-contrast)] mt-1 tabular-nums">{formatCurrency(bankBalance)}</h2>
                    </div>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModeFilter(modeFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                    className={clsx(
                        "glass p-3.5 rounded-2xl border bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm cursor-pointer transition-all",
                        modeFilter === 'ONLINE'
                            ? "border-purple-500 ring-2 ring-purple-500/30 scale-[1.02] shadow-lg shadow-purple-500/10"
                            : "border-[var(--foreground)]/10"
                    )}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowRightLeft className="h-10 w-10 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <span className={clsx(
                            "text-[12px] font-black uppercase tracking-widest transition-colors",
                            modeFilter === 'ONLINE' ? "text-purple-500" : "text-[var(--foreground)]/30"
                        )}>Online</span>
                        <h2 className="text-[22px] font-black text-[var(--deep-contrast)] mt-1 tabular-nums">{formatCurrency(onlineBalance)}</h2>
                    </div>
                </motion.div>
            </div>

            {/* Analytics - Compact */}
            <div id="finance-stats" className="glass p-4 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[16px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Cash Flow Analysis</h3>
                    <span className="text-[18px] font-black text-[var(--primary-green)] tabular-nums">{incomePercent.toFixed(1)}% Yield</span>
                </div>
                <div className="flex h-2 w-full bg-rose-500/10 rounded-full overflow-hidden p-0.5 border border-[var(--foreground)]/5 relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incomePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    />
                </div>
                <div className="flex justify-between mt-3 px-1">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[14px] font-black text-emerald-700 uppercase tracking-tighter">In: {formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="text-[14px] font-black text-rose-700 uppercase tracking-tighter">Out: {formatCurrency(totalExpenses)}</span>
                    </div>
                </div>
            </div>

            {/* Ledger Feed */}
            <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-2xl">
                <div className="px-5 py-3 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center">
                    <h3 className="text-[13px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Daily Record</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[11px] font-black uppercase tracking-widest text-[var(--primary-green)]">Live Data</span>
                </div>
                <div id="finance-list" className="divide-y divide-[var(--foreground)]/5">
                    {(loading || isContextLoading) ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <LoadingSpinner size="lg" label="Synchronizing Wallet..." />
                            <p className="text-[12px] font-black text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-3">Accessing Ledger Archives</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredTransactions.map((t) => (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={(e) => handleEdit(e, t)}
                                        className="group p-2 hover:bg-[var(--foreground)]/5 transition-all flex justify-between items-center cursor-pointer active:scale-[0.99] border-b border-[var(--foreground)]/5 last:border-0 h-[56px] gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "h-8 w-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0",
                                                t.type === 'RECEIPT' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                            )}>
                                                {t.type === 'RECEIPT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="text-[13px] font-black text-[var(--deep-contrast)] truncate uppercase tracking-tight leading-none">{t.party?.name || t.description || 'General Log'}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={clsx(
                                                        "text-[5.5px] font-black px-1 py-0.5 rounded-md uppercase tracking-widest border shrink-0",
                                                        t.mode === 'CASH' ? "bg-amber-100/50 text-amber-700 border-amber-200" :
                                                            t.mode === 'BANK' ? "bg-blue-100/50 text-blue-700 border-blue-200" :
                                                                "bg-purple-100/50 text-purple-700 border-purple-200"
                                                    )}>
                                                        {t.mode}
                                                    </span>
                                                    <div className="h-0.5 w-0.5 rounded-full bg-[var(--foreground)]/20" />
                                                    <span className="text-[6.5px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.1em]">
                                                        {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className={clsx(
                                                    "text-[15px] font-black tabular-nums tracking-tighter leading-none",
                                                    t.type === 'RECEIPT' ? "text-emerald-500" : "text-rose-500"
                                                )}>
                                                    {t.type === 'RECEIPT' ? '+' : '-'} {formatCurrency(t.amount)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 transition-opacity shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.print()
                                                    }}
                                                    className="h-5 w-5 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:bg-[var(--primary-green)] hover:text-white transition-all shadow-sm active:scale-90"
                                                >
                                                    <Printer size={7} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(e, t); }}
                                                    className="h-5 w-5 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                >
                                                    <Edit2 size={7} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(e, t.id); }}
                                                    className="h-5 w-5 flex items-center justify-center rounded-md bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                >
                                                    <Trash2 size={7} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-20 opacity-20">
                                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                    <p className="text-[13px] font-black uppercase tracking-[0.3em]">Ledger is Empty</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDelete(confirmModal.transactionId)}
                isLoading={isDeleting}
                title="Delete Entry?"
                message="Permanently remove this entry from your financial record? This action is irreversible."
                confirmText="Delete"
                variant="danger"
            />

            <PickerModal
                isOpen={isSortPickerOpen}
                onClose={() => setIsSortPickerOpen(false)}
                onSelect={(val) => {
                    const [by, order] = val.split('-')
                    setSortBy(by as any)
                    setSortOrder(order as any)
                    setIsSortPickerOpen(false)
                }}
                title="Arrange List"
                showSearch={false}
                options={[
                    { id: 'date-desc', label: 'DATE (NEWEST FIRST)' },
                    { id: 'date-asc', label: 'DATE (OLDEST FIRST)' },
                    { id: 'amount-desc', label: 'AMOUNT (HIGH TO LOW)' },
                    { id: 'amount-asc', label: 'AMOUNT (LOW TO HIGH)' },
                    { id: 'party-asc', label: 'PARTY (A-Z)' },
                ]}
                selectedValue={`${sortBy}-${sortOrder}`}
            />

            <PickerModal
                isOpen={isTypePickerOpen}
                onClose={() => setIsTypePickerOpen(false)}
                onSelect={(val) => {
                    setTypeFilter(val)
                    setIsTypePickerOpen(false)
                }}
                title="Group by Type"
                showSearch={false}
                options={[
                    { id: 'ALL', label: 'All Logs' },
                    { id: 'RECEIPT', label: 'Received' },
                    { id: 'PAYMENT', label: 'Paid' },
                ]}
                selectedValue={typeFilter}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={(val) => {
                    setModeFilter(val)
                    setIsModePickerOpen(false)
                }}
                title="Choose Account"
                showSearch={false}
                options={[
                    { id: 'ALL', label: 'All Modes' },
                    { id: 'CASH', label: 'Cash' },
                    { id: 'BANK', label: 'Bank' },
                    { id: 'ONLINE', label: 'Online' },
                ]}
                selectedValue={modeFilter}
            />
        </div >
    )
}
