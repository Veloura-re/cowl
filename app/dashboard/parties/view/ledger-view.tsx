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
            <div className="glass p-6 rounded-[32px] border border-white/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <User className="h-32 w-32" />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2">
                            <div>
                                <h1 className="text-3xl font-black text-[var(--deep-contrast)] tracking-tight">{party.name}</h1>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                                    party.type === 'CUSTOMER' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        party.type === 'SUPPLIER' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                            "bg-purple-50 text-purple-600 border-purple-100"
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Current Balance</p>
                            <div className={clsx(
                                "text-4xl font-black tracking-tighter",
                                party.opening_balance > 0 ? "text-emerald-600" :
                                    party.opening_balance < 0 ? "text-rose-600" : "text-[var(--deep-contrast)]"
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
                <div className="flex p-1 bg-white/40 rounded-xl border border-white/40">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'invoices' ? "bg-[var(--deep-contrast)] text-white shadow-lg" : "text-[var(--foreground)]/60 hover:bg-white/40"
                        )}
                    >
                        Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'transactions' ? "bg-[var(--deep-contrast)] text-white shadow-lg" : "text-[var(--foreground)]/60 hover:bg-white/40"
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
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/50 border border-white/40 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-2">
                {activeTab === 'invoices' ? (
                    filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                        <div key={inv.id} className="glass p-4 rounded-2xl border border-white/40 flex items-center justify-between group hover:bg-white/60 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--deep-contrast)]">{inv.invoice_number}</h3>
                                    <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-widest">
                                        {format(new Date(inv.date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--deep-contrast)]">{formatCurrency(inv.total_amount)}</p>
                                <span className={clsx(
                                    "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                    inv.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        inv.status === 'UNPAID' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                    {inv.status}
                                </span>
                            </div>
                        </div>
                    )) : <div className="text-center py-10 opacity-40 text-xs font-bold uppercase tracking-widest">No Invoices Found</div>
                ) : (
                    filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                        <div key={tx.id} className="glass p-4 rounded-2xl border border-white/40 flex items-center justify-between group hover:bg-white/60 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                    tx.type === 'PAYMENT_IN' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {tx.type === 'PAYMENT_IN' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--deep-contrast)]">{tx.number || 'Transaction'}</h3>
                                    <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-widest">
                                        {format(new Date(tx.date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={clsx(
                                    "text-sm font-bold",
                                    tx.type === 'PAYMENT_IN' ? "text-emerald-600" : "text-[var(--deep-contrast)]"
                                )}>
                                    {tx.type === 'PAYMENT_IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </p>
                                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">
                                    {tx.mode || 'Cash'}
                                </p>
                            </div>
                        </div>
                    )) : <div className="text-center py-10 opacity-40 text-xs font-bold uppercase tracking-widest">No Transactions Found</div>
                )}
            </div>
        </div>
    )
}
