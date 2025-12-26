'use client'

import { useState } from 'react'
import { Plus, Search, Filter, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SalesClientView({ initialInvoices }: { initialInvoices: any[] }) {
    const [invoices, setInvoices] = useState(initialInvoices)
    const [search, setSearch] = useState('')

    const filteredInvoices = invoices.filter((inv) =>
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.party?.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Sales</h1>
                    <p className="mt-1 text-[var(--text-secondary)]">
                        Manage your invoices and revenue
                    </p>
                </div>
                <Link
                    href="/dashboard/sales/new"
                    className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-highlight)]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search invoice number or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg bg-[var(--background)] py-2 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] border border-transparent focus:border-[var(--primary)]"
                    />
                </div>
            </div>

            {/* List */}
            <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--surface-highlight)]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Date</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Invoice #</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Party</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-highlight)]">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-[var(--surface-highlight)]/50 transition-colors">
                                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                                            {new Date(inv.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-main)] font-medium">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-main)]">
                                            {inv.party?.name || 'Cash Sale'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[var(--text-main)]">
                                            {inv.total_amount}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={
                                                "px-2 py-1 rounded text-xs font-semibold " +
                                                (inv.status === 'PAID' ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]" :
                                                    inv.status === 'UNPAID' ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]" :
                                                        "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]")
                                            }>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
