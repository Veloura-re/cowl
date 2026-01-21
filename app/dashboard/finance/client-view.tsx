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
import FeedbackModal from '@/components/ui/FeedbackModal'
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
            setLoading(true)
            console.log('FinanceClientView: Fetching fresh ledger...')
            const { data, error } = await supabase
                .from('transactions')
                .select('*, party:parties(name)')
                .order('date', { ascending: false })
                .limit(50)
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

    const businessTransactions = (transactions || []).filter(t => t.business_id === activeBusinessId)

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

    const fetchData = () => {
        window.location.reload();
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header - Sophisticated */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--primary-green)]/10">
                <div>
                    <h1 className="text-2xl font-black text-[var(--deep-contrast)] tracking-tight">Payments</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none">Financial Intelligence & Ledger</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/dashboard/finance/new?type=RECEIPT')}
                        className="group flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all shadow-xl shadow-emerald-500/20 active:scale-95 border border-emerald-400/20"
                    >
                        <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                        Got Payment
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/finance/new?type=PAYMENT')}
                        className="group flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl bg-rose-600/90 hover:bg-rose-600 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all shadow-xl shadow-rose-500/20 active:scale-95 border border-rose-400/20"
                    >
                        <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                        Gave Payment
                    </button>
                </div>
            </div>

            {/* Main Stats - 2 Columns (Side by Side) */}
            <div className="grid grid-cols-2 gap-3">
                {/* Cash Card */}
                <div className="glass p-4 rounded-3xl border border-white/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-12 w-12 text-[var(--primary-green)]" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">Cash in Hand</span>
                        <h2 className="text-xl font-black text-[var(--deep-contrast)] mt-1">{formatCurrency(cashBalance)}</h2>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (cashIn / (cashIn + cashOut || 1)) * 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Card */}
                <div className="glass p-4 rounded-3xl border border-white/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-12 w-12 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">Bank Balance</span>
                        <h2 className="text-xl font-black text-[var(--deep-contrast)] mt-1">{formatCurrency(bankBalance)}</h2>
                        <div className="flex items-center gap-2 mt-3 text-[9px] font-bold">
                            <span className="text-emerald-600">+{formatCurrency(bankIn)}</span>
                            <span className="opacity-20">|</span>
                            <span className="text-rose-600">-{formatCurrency(bankOut)}</span>
                        </div>
                    </div>
                </div>

                {/* Online Card */}
                <div className="glass p-4 rounded-3xl border border-white/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowRightLeft className="h-12 w-12 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">Online / Wallet</span>
                        <h2 className="text-xl font-black text-[var(--deep-contrast)] mt-1">{formatCurrency(onlineBalance)}</h2>
                        <div className="mt-3 flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-purple-500/30' : 'bg-black/5'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cash Flow Analytics */}
            <div className="glass p-5 rounded-[2rem] border border-white/40">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xs font-black text-[var(--deep-contrast)] uppercase tracking-wider">Cash Flow Analysis</h3>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 mt-0.5">Ratio of Receipts vs Payments</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-[var(--primary-green)] leading-none">{incomePercent.toFixed(1)}%</p>
                        <p className="text-[8px] font-bold uppercase text-[var(--foreground)]/40">Positive Ratio</p>
                    </div>
                </div>
                <div className="flex h-3 w-full bg-rose-500/20 rounded-full overflow-hidden p-0.5 border border-white/40 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incomePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40 relative group"
                    >
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-2 border-emerald-500 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                </div>
                <div className="flex justify-between mt-3 text-[9px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="opacity-40">Total In:</span>
                        <span className="text-emerald-700">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="opacity-40">Total Out:</span>
                        <span className="text-rose-700">{formatCurrency(totalExpenses)}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 rounded-xl bg-white/50 border border-white/20 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/20"
                    />
                </div>
                <button
                    onClick={() => setIsSortPickerOpen(true)}
                    className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                >
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                    <span>Sort</span>
                </button>
                <button
                    onClick={() => setIsTypePickerOpen(true)}
                    className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                >
                    <Filter className="h-3 w-3 opacity-40" />
                    <span>Type</span>
                </button>
                <button
                    onClick={() => setIsModePickerOpen(true)}
                    className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                >
                    <Wallet className="h-3 w-3 opacity-40" />
                    <span>Mode</span>
                </button>
            </div>

            <PickerModal
                isOpen={isSortPickerOpen}
                onClose={() => setIsSortPickerOpen(false)}
                onSelect={(val) => {
                    if (['date', 'amount', 'party'].includes(val)) {
                        setSortBy(val as 'date' | 'amount' | 'party')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                        // Handle compound sort values if I used them in options
                        const [by, order] = val.split('-')
                        setSortBy(by as 'date' | 'amount' | 'party')
                        setSortOrder(order as 'asc' | 'desc')
                    }
                    setIsSortPickerOpen(false)
                }}
                title="Sort Ledger"
                showSearch={false}
                options={[
                    { id: 'date-desc', label: 'DATE (NEWEST FIRST)' },
                    { id: 'date-asc', label: 'DATE (OLDEST FIRST)' },
                    { id: 'amount-high', label: 'AMOUNT (HIGH TO LOW)' },
                    { id: 'amount-low', label: 'AMOUNT (LOW TO HIGH)' },
                    { id: 'party-asc', label: 'PARTY (A-Z)' },
                ]}
                selectedValue={`${sortBy}-${sortOrder === 'desc' && sortBy === 'amount' ? 'high' : sortOrder === 'asc' && sortBy === 'amount' ? 'low' : sortOrder}`}
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
                    { id: 'ALL', label: 'ALL ENTRIES' },
                    { id: 'RECEIPT', label: 'INCOME (IN)' },
                    { id: 'PAYMENT', label: 'EXPENSE (OUT)' },
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
                    { id: 'CASH', label: 'CASH' },
                    { id: 'BANK', label: 'BANK' },
                    { id: 'ONLINE', label: 'ONLINE' },
                ]}
                selectedValue={modeFilter}
            />

            {/* Statement Ledger */}
            <div className="glass rounded-[2rem] border border-white/40 overflow-hidden shadow-2xl">
                <div className="px-5 py-3 border-b border-white/10 bg-white/40 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Statement Ledger</h3>
                    <div className="px-2 py-0.5 rounded-full bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[7px] font-black uppercase tracking-wider text-[var(--primary-green)]">Live Feed</div>
                </div>
                <div className="divide-y divide-white/5">
                    {(loading || isContextLoading) ? (
                        <div className="py-24 flex flex-col items-center justify-center animate-pulse">
                            <LoadingSpinner size="lg" label="Synchronizing Wallet..." />
                            <p className="text-[8px] font-bold text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-3">Vault Connection Established</p>
                        </div>
                    ) : (
                        <>
                            {!isContextLoading && filteredTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={(e) => handleEdit(e, t)}
                                    className="group p-3 hover:bg-white/40 active:bg-white/60 transition-all flex justify-between items-center cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "h-9 w-9 rounded-xl flex items-center justify-center shadow-inner transition-all group-hover:scale-110",
                                            t.type === 'RECEIPT' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {t.type === 'RECEIPT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] font-black text-[var(--deep-contrast)] leading-none">{t.party?.name || t.description || 'General Entry'}</p>
                                                <span className={clsx(
                                                    "text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-wider border",
                                                    t.mode === 'CASH' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                        t.mode === 'BANK' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                            "bg-purple-50 text-purple-700 border-purple-200"
                                                )}>
                                                    {t.mode}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 opacity-40">
                                                    <Calendar className="h-2 w-2" />
                                                    <span className="text-[8px] font-bold lowercase">{new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                                {t.description && <span className="text-[8px] font-medium text-[var(--foreground)]/30 truncate max-w-[150px]">{t.description}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={clsx(
                                                "text-xs font-black tracking-tight",
                                                t.type === 'RECEIPT' ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {t.type === 'RECEIPT' ? '+' : '-'} {formatCurrency(t.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5 transition-all">
                                                <button
                                                    onClick={(e) => handleEdit(e, t)}
                                                    className="p-1 rounded-md bg-white shadow-sm border border-black/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all scale-100"
                                                >
                                                    <Edit2 className="h-2.5 w-2.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, t.id)}
                                                    className="p-1 rounded-md bg-white shadow-sm border border-black/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all scale-100"
                                                >
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-10 opacity-30">
                                    <p className="text-[9px] font-black uppercase tracking-wider">Vault is Empty</p>
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
                title="Delete Entry?"
                message="This will permanently remove the transaction from your financial history."
                confirmText="Delete"
                cancelText="Abort"
            />
        </div>
    )
}
