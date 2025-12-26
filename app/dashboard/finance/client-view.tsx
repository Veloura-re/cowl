'use client'

import { useState } from 'react'
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react'
import Link from 'next/link'

import PaymentModal from './payment-modal'

export default function FinanceClientView({ initialTransactions }: { initialTransactions: any[] }) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [modalType, setModalType] = useState<'RECEIPT' | 'PAYMENT' | null>(null)

    // MOCK BALANCES (Since we need aggregate data)
    const cashBalance = 5400
    const bankBalance = 12000

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Finance</h1>
                    <p className="mt-1 text-[var(--text-secondary)]">
                        Cash flow and accounts
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setModalType('RECEIPT')}
                        className="flex items-center justify-center rounded-lg bg-[var(--color-status-success)] text-[var(--background)] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-all">
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        Record In
                    </button>
                    <button
                        onClick={() => setModalType('PAYMENT')}
                        className="flex items-center justify-center rounded-lg bg-[var(--color-status-error)] text-[var(--background)] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-all">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Record Out
                    </button>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Cash In Hand</p>
                            <p className="text-2xl font-bold text-[var(--text-main)]">${cashBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-[var(--info)]/10 text-[var(--info)]">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Bank Balance</p>
                            <p className="text-2xl font-bold text-[var(--text-main)]">${bankBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--surface-highlight)]">
                    <h3 className="font-semibold text-[var(--text-main)]">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--surface-highlight)]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Date</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Party / Description</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Mode</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-highlight)]">
                            {transactions.length > 0 ? (
                                transactions.map((txn) => (
                                    <tr key={txn.id} className="group hover:bg-[var(--surface-highlight)]/50 transition-colors">
                                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-main)] font-medium">
                                            {txn.party?.name || txn.description}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)] uppercase text-xs font-bold tracking-wider">
                                            {txn.mode}
                                        </td>
                                        <td className={
                                            "px-6 py-4 text-right font-bold " +
                                            (txn.type === 'RECEIPT' ? "text-[var(--color-status-success)]" : "text-[var(--color-status-error)]")
                                        }>
                                            {txn.type === 'RECEIPT' ? '+' : '-'}{txn.amount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <PaymentModal
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || 'RECEIPT'} // Safe default
            />
        </div>
    )
}
