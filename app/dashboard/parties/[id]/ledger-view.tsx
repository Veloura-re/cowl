'use client'

import { useState } from 'react'
import { ArrowLeft, Phone, Mail, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'

type PartyLedgerProps = {
    party: any
    initialInvoices: any[]
    initialTransactions: any[]
}

export default function PartyLedgerView({ party, initialInvoices, initialTransactions }: PartyLedgerProps) {
    const router = useRouter()
    const { formatCurrency } = useBusiness()

    // Merge and sort
    const history = [
        ...initialInvoices.map(i => ({
            ...i,
            entryType: 'INVOICE',
            description: `Invoice #${i.invoice_number}`,
            amount: i.total_amount,
            effect: i.type === 'SALE' ? 'DEBIT' : 'CREDIT'
        })),
        ...initialTransactions.map(t => ({
            ...t,
            entryType: 'TRANSACTION',
            effect: t.type === 'RECEIPT' ? 'CREDIT' : 'DEBIT'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
            {/* Header - Compact */}
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <Link href="/dashboard/parties" className="p-2 rounded-xl bg-white/50 border border-white/20 hover:bg-[var(--primary-green)] hover:text-white text-[var(--foreground)] transition-all shadow-sm">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">{party.name}</h1>
                    <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 leading-none mt-1">
                        {party.phone && <span className="flex items-center gap-1.5"><Phone className="h-2.5 w-2.5" /> {party.phone}</span>}
                        {party.email && <span className="flex items-center gap-1.5"><Mail className="h-2.5 w-2.5" /> {party.email}</span>}
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-green)]/10 text-[var(--primary-green)]">{party.type}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Total Balance</p>
                    <p className={clsx(
                        "text-xl font-bold tracking-tight",
                        party.opening_balance > 0 ? 'text-emerald-600' : party.opening_balance < 0 ? 'text-rose-600' : 'text-[var(--deep-contrast)]'
                    )}>
                        {party.opening_balance > 0 ? '+' : ''}{formatCurrency(party.opening_balance).replace(/^-/, '')}
                    </p>
                </div>
            </div>

            {/* Quick Actions - Small buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button className="h-10 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-700 font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest text-[10px]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Sale (Gave)
                </button>
                <button className="h-10 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest text-[10px]">
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Receipt (Got)
                </button>
            </div>

            {/* Ledger Table - Ultra Compact */}
            <div className="glass overflow-hidden rounded-[24px] border border-white/40 shadow-sm">
                <div className="px-5 py-3 border-b border-white/20 bg-white/40">
                    <h3 className="text-[10px] font-bold text-[var(--deep-contrast)] uppercase tracking-widest">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--primary-green)]/5 border-b border-[var(--primary-green)]/10">
                            <tr>
                                <th className="px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-[var(--foreground)]/50">Date</th>
                                <th className="px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-[var(--foreground)]/50">Details</th>
                                <th className="px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-[var(--foreground)]/50 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--primary-green)]/5">
                            {history.length > 0 ? history.map((entry, i) => (
                                <tr key={i} className="group hover:bg-white/60 transition-colors cursor-default">
                                    <td className="px-5 py-3 text-[10px] text-[var(--foreground)]/60 font-bold">{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={clsx(
                                                "h-6 w-6 rounded-lg flex items-center justify-center shadow-inner",
                                                entry.effect === 'CREDIT' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                            )}>
                                                {entry.entryType === 'INVOICE' ? <Receipt className="h-3 w-3" /> : (entry.effect === 'CREDIT' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />)}
                                            </div>
                                            <span className="text-[10px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">{entry.description || (entry.effect === 'DEBIT' ? 'Payment Out' : 'Cash Receipt')}</span>
                                        </div>
                                    </td>
                                    <td className={clsx(
                                        "px-5 py-3 text-right text-xs font-bold tracking-tight",
                                        entry.effect === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                                    )}>
                                        {entry.effect === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount).replace(/^-/, '')}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-5 py-8 text-center text-[10px] font-bold text-[var(--foreground)]/30 uppercase tracking-[0.2em]">No transactions history</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
