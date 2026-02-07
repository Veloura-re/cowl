'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, FileText, ArrowUpRight, ArrowDownRight, Wallet, Calendar, User, Search } from 'lucide-react'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { format } from 'date-fns'

interface PartyLedgerViewProps {
    party: any
    initialInvoices: any[]
    initialTransactions: any[]
}

export default function PartyLedgerView({ party, initialInvoices, initialTransactions }: PartyLedgerViewProps) {
    const { formatCurrency } = useBusiness()
    const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredInvoices = initialInvoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.total_amount.toString().includes(searchQuery)
    )

    const filteredTransactions = initialTransactions.filter(tx =>
        tx.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toString().includes(searchQuery)
    )

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Profile Card */}
            <div className="glass p-6 rounded-[32px] border border-gray-200 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <User className="h-32 w-32" />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2">
                            <div>
                                <h1 className="text-3xl font-black text-[var(--deep-contrast)] tracking-tight">{party.name}</h1>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-lg text-[14px] font-bold uppercase tracking-wider border",
                                    party.type === 'CUSTOMER' ? "bg-[var(--status-info)] text-[var(--status-info-foreground)] border-[var(--status-info-border)]" :
                                        party.type === 'SUPPLIER' ? "bg-[var(--status-warning)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]" :
                                            "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                                )}>
                                    {party.type}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground)]/70">
                                {party.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 opacity-50" />
                                        <span>{party.phone}</span>
                                    </div>
                                )}
                                {party.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 opacity-50" />
                                        <span>{party.email}</span>
                                    </div>
                                )}
                                {party.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 opacity-50" />
                                        <span>{party.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center">
                            <p className="text-[14px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Current Balance</p>
                            <div className={clsx(
                                "text-4xl font-black tracking-tighter",
                                party.opening_balance > 0 ? "text-[var(--status-success-foreground)]" :
                                    party.opening_balance < 0 ? "text-[var(--status-danger-foreground)]" : "text-[var(--deep-contrast)]"
                            )}>
                                {formatCurrency(Math.abs(party.opening_balance))}
                                <span className="text-lg ml-1 align-top opacity-50">
                                    {party.opening_balance > 0 ? 'CR' : party.opening_balance < 0 ? 'DR' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex p-1 bg-white/40 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'invoices' ? "bg-[var(--deep-contrast)] text-white shadow-lg" : "text-[var(--foreground)]/60 hover:bg-white/40 dark:hover:bg-white/5"
                        )}
                    >
                        Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'transactions' ? "bg-[var(--deep-contrast)] text-white shadow-lg" : "text-[var(--foreground)]/60 hover:bg-white/40 dark:hover:bg-white/5"
                        )}
                    >
                        Transactions
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 text-[var(--deep-contrast)]"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-2">
                {activeTab === 'invoices' ? (
                    filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                        <div key={inv.id} className="glass p-4 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between group hover:bg-white/60 dark:hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--deep-contrast)]">{inv.invoice_number}</h3>
                                    <p className="text-[14px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
                                        {format(new Date(inv.date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--deep-contrast)]">{formatCurrency(inv.total_amount)}</p>
                                <span className={clsx(
                                    "text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                                    inv.status === 'PAID' ? "bg-[var(--status-success)] text-[var(--status-success-foreground)] border-[var(--status-success-border)]" :
                                        inv.status === 'UNPAID' ? "bg-[var(--status-danger)] text-[var(--status-danger-foreground)] border-[var(--status-danger-border)]" :
                                            "bg-[var(--status-warning)] text-[var(--status-warning-foreground)] border-[var(--status-warning-border)]"
                                )}>
                                    {inv.status}
                                </span>
                            </div>
                        </div>
                    )) : <div className="text-center py-10 opacity-40 text-xs font-bold uppercase tracking-wider">No Invoices Found</div>
                ) : (
                    filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                        <div key={tx.id} className="glass p-4 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between group hover:bg-white/60 dark:hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                    tx.type === 'RECEIPT' ? "bg-[var(--status-success)] text-[var(--status-success-foreground)]" : "bg-[var(--status-danger)] text-[var(--status-danger-foreground)]"
                                )}>
                                    {tx.type === 'RECEIPT' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--deep-contrast)]">{tx.number || 'Transaction'}</h3>
                                    <p className="text-[14px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
                                        {format(new Date(tx.date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={clsx(
                                    "text-sm font-bold",
                                    tx.type === 'RECEIPT' ? "text-[var(--status-success-foreground)]" : "text-[var(--status-danger-foreground)]"
                                )}>
                                    {tx.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </p>
                                <p className="text-[12px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">
                                    {tx.mode || 'Cash'}
                                </p>
                            </div>
                        </div>
                    )) : <div className="text-center py-10 opacity-40 text-xs font-bold uppercase tracking-wider">No Transactions Found</div>
                )}
            </div>
        </div>
    )
}
