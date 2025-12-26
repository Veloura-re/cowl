'use client'

import { useState } from 'react'
import { ArrowLeft, Phone, Mail, MapPin, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PartyLedgerProps = {
    party: any
    initialInvoices: any[]
    initialTransactions: any[]
}

export default function PartyLedgerView({ party, initialInvoices, initialTransactions }: PartyLedgerProps) {
    const router = useRouter()

    // Merge and sort
    const history = [
        ...initialInvoices.map(i => ({
            ...i,
            entryType: 'INVOICE',
            description: `Invoice #${i.invoice_number}`,
            amount: i.total_amount,
            isCredit: i.type === 'SALE', // Sale = We gave goods = Party Owes Us (Debit in accounting, but Credit to Stock... wait.)
            // Simpler: Party Ledger.
            // Sale -> Party Debit (Receivable)
            // Receipt -> Party Credit (Reduces Receivable)
            // Purchase -> Party Credit (Payable)
            // Payment -> Party Debit (Reduces Payable)

            // Let's use simple Logic:
            // "Gave" (Sale) vs "Got" (Payment)
            effect: i.type === 'SALE' ? 'DEBIT' : 'CREDIT'
        })),
        ...initialTransactions.map(t => ({
            ...t,
            entryType: 'TRANSACTION',
            effect: t.type === 'RECEIPT' ? 'CREDIT' : 'DEBIT'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/parties" className="p-2 rounded-lg hover:bg-[var(--surface-highlight)] text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">{party.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-1">
                        {party.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {party.phone}</span>}
                        {party.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {party.email}</span>}
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-[var(--text-secondary)]">Current Balance</p>
                    <p className={"text-xl font-bold " + (party.opening_balance > 0 ? 'text-[var(--success)]' : party.opening_balance < 0 ? 'text-[var(--error)]' : 'text-[var(--text-main)]')}>
                        {party.opening_balance > 0 ? '+' : ''}{party.opening_balance}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-lg border border-[var(--surface-highlight)] bg-[var(--surface)] text-[var(--color-status-error)] font-medium hover:bg-[var(--color-status-error)]/10 transition-colors flex items-center justify-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    You Gave (Sale)
                </button>
                <button className="flex-1 py-3 rounded-lg border border-[var(--surface-highlight)] bg-[var(--surface)] text-[var(--color-status-success)] font-medium hover:bg-[var(--color-status-success)]/10 transition-colors flex items-center justify-center gap-2">
                    <ArrowDownLeft className="h-4 w-4" />
                    You Got (Receipt)
                </button>
            </div>

            {/* Ledger Table */}
            <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface-highlight)]">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Date</th>
                            <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Description</th>
                            <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-highlight)]">
                        {history.map((entry, i) => (
                            <tr key={i} className="hover:bg-[var(--surface-highlight)]/50">
                                <td className="px-6 py-4 text-[var(--text-secondary)]">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-[var(--text-main)] font-medium">
                                    <div className="flex items-center gap-2">
                                        {entry.entryType === 'INVOICE' ? <Receipt className="h-4 w-4 text-[var(--primary)]" /> : null}
                                        {entry.description || (entry.effect === 'DEBIT' ? 'Sale/Payment Out' : 'Receipt/Purchase')}
                                    </div>
                                </td>
                                <td className={"px-6 py-4 text-right font-medium " + (entry.effect === 'CREDIT' ? 'text-[var(--success)]' : 'text-[var(--error)]')}>
                                    {entry.effect === 'CREDIT' ? '+' : '-'}{entry.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
