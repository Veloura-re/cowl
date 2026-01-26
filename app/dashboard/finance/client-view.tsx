'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, TrendingUp, TrendingDown, Receipt, ArrowRightLeft, Search, Filter, ArrowUpDown, Trash2, Edit2, Calendar } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Payments</h1>
                        <p className="text-[10px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Financial Ledger</p>
                    </div>
                    <div className="flex gap-2">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard/finance/new?type=RECEIPT')}
                            className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 border border-[var(--primary-foreground)]/10 group"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                            <span>In</span>
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard/finance/new?type=PAYMENT')}
                            className="flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 border border-white/10 group"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                            <span>Out</span>
                        </motion.button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                        <input
                            type="text"
                            placeholder="Search ledger..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/40"
                        />
                    </div>
                    <button
                        onClick={() => setIsSortPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm"
                    >
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                        <span>Sort</span>
                    </button>
                    <button
                        onClick={() => setIsTypePickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm"
                    >
                        <Filter className="h-3 w-3 opacity-40" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Quick Modes Bar */}
            <div className="grid grid-cols-3 gap-2">
                <div className="glass p-2.5 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-8 w-8 text-[var(--primary-green)]" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Cash</span>
                        <h2 className="text-[13px] font-black text-[var(--deep-contrast)] mt-0.5 tabular-nums">{formatCurrency(cashBalance)}</h2>
                    </div>
                </div>
                <div className="glass p-2.5 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Bank</span>
                        <h2 className="text-[13px] font-black text-[var(--deep-contrast)] mt-0.5 tabular-nums">{formatCurrency(bankBalance)}</h2>
                    </div>
                </div>
                <div className="glass p-2.5 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowRightLeft className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Online</span>
                        <h2 className="text-[13px] font-black text-[var(--deep-contrast)] mt-0.5 tabular-nums">{formatCurrency(onlineBalance)}</h2>
                    </div>
                </div>
            </div>

            {/* Analytics - Compact */}
            <div className="glass p-3 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[8px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Cash Flow Analysis</h3>
                    <span className="text-[10px] font-black text-[var(--primary-green)] tabular-nums">{incomePercent.toFixed(1)}% Yield</span>
                </div>
                <div className="flex h-1.5 w-full bg-rose-500/10 rounded-full overflow-hidden p-0.5 border border-[var(--foreground)]/5 relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incomePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    />
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter">In: {formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span className="text-[8px] font-black text-rose-700 uppercase tracking-tighter">Out: {formatCurrency(totalExpenses)}</span>
                    </div>
                </div>
            </div>

            {/* Ledger Feed */}
            <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-2xl">
                <div className="px-5 py-3 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center">
                    <h3 className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Transaction Ledger</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[7px] font-black uppercase tracking-widest text-[var(--primary-green)]">Live Data</span>
                </div>
                <div className="divide-y divide-[var(--foreground)]/5">
                    {(loading || isContextLoading) ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <LoadingSpinner size="lg" label="Synchronizing Wallet..." />
                            <p className="text-[8px] font-black text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-3">Accessing Ledger Archives</p>
                        </div>
                    ) : (
                        <>
                            {filteredTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={(e) => handleEdit(e, t)}
                                    className="group p-3 hover:bg-[var(--foreground)]/5 transition-all flex justify-between items-center cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "h-8 w-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                            t.type === 'RECEIPT' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {t.type === 'RECEIPT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[11px] font-black text-[var(--deep-contrast)] truncate uppercase tracking-tight">{t.party?.name || t.description || 'General Log'}</h4>
                                                <span className={clsx(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border shadow-sm",
                                                    t.mode === 'CASH' ? "bg-[var(--status-warning)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]" :
                                                        t.mode === 'BANK' ? "bg-[var(--status-info)] text-[var(--status-info-foreground)] border-[var(--status-info-border)]" :
                                                            "bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                                                )}>
                                                    {t.mode}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Calendar className="h-2 w-2 text-[var(--foreground)]/20" />
                                                <span className="text-[8px] font-black text-[var(--foreground)]/30 uppercase tracking-widest">
                                                    {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={clsx(
                                                "text-[13px] font-black tabular-nums tracking-tighter",
                                                t.type === 'RECEIPT' ? "text-[var(--status-success-foreground)]" : "text-[var(--status-danger-foreground)]"
                                            )}>
                                                {t.type === 'RECEIPT' ? '+' : '-'} {formatCurrency(t.amount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(e, t); }}
                                                className="p-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-90"
                                            >
                                                <Edit2 className="h-2.5 w-2.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(e, t.id); }}
                                                className="p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                            >
                                                <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-20 opacity-20">
                                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Ledger is Empty</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDelete(confirmModal.transactionId)}
                isLoading={isDeleting}
                title="Purge Transaction?"
                message="Permanently remove this entry from your financial ledger? This action is irreversible."
                confirmText="Purge"
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
                title="Sort Ledger"
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
                title="Filter by Type"
                showSearch={false}
                options={[
                    { id: 'ALL', label: 'ALL LOGS' },
                    { id: 'RECEIPT', label: 'RECEIPTS (IN)' },
                    { id: 'PAYMENT', label: 'PAYMENTS (OUT)' },
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
                title="Filter by Mode"
                showSearch={false}
                options={[
                    { id: 'ALL', label: 'ALL MODES' },
                    { id: 'CASH', label: 'CASH ACCOUNT' },
                    { id: 'BANK', label: 'BANK ACCOUNT' },
                    { id: 'ONLINE', label: 'ONLINE GATEWAY' },
                ]}
                selectedValue={modeFilter}
            />
        </div>
    )
}
