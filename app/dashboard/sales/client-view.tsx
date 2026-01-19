'use client'

import { useState } from 'react'
import { Search, Plus, Calendar, FileText, User, Filter, ArrowUpDown, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import FeedbackModal from '@/components/ui/FeedbackModal'
import { Loader2 } from 'lucide-react'

export default function SalesClientView({ initialInvoices }: { initialInvoices: any[] }) {
    const router = useRouter()
    const { activeBusinessId, formatCurrency } = useBusiness()
    const [invoices, setInvoices] = useState(initialInvoices)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isSortPickerOpen, setIsSortPickerOpen] = useState(false)
    const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false)
    const supabase = createClient()

    const handleEdit = (invoice: any) => {
        router.push(`/dashboard/sales/${invoice.id}/edit`)
    }

    let filteredInvoices = invoices.filter((inv) =>
        inv.business_id === activeBusinessId && (
            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.party?.name && inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ) && (statusFilter === 'ALL' || inv.status === statusFilter)
    )

    // Sort
    filteredInvoices = [...filteredInvoices].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1
        if (sortBy === 'date') {
            return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
        } else {
            return multiplier * (a.total_amount - b.total_amount)
        }
    })

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Sales</h1>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-widest leading-none">Invoice Log</p>

                    </div>
                    <Link
                        href="/dashboard/sales/new"
                        className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        New Sale
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 rounded-xl bg-white/50 border border-white/20 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/20"
                        />
                    </div>
                    <button
                        onClick={() => setIsSortPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-widest hover:bg-white/10 transition-all shadow-sm"
                    >
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                        <span>Sort</span>
                    </button>
                    <button
                        onClick={() => setIsFilterPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-widest hover:bg-white/10 transition-all shadow-sm"
                    >
                        <Filter className="h-3 w-3 opacity-40" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            <PickerModal
                isOpen={isSortPickerOpen}
                onClose={() => setIsSortPickerOpen(false)}
                onSelect={(val) => {
                    const [by, order] = val.split('-')
                    setSortBy(by as 'date' | 'amount')
                    setSortOrder(order as 'asc' | 'desc')
                    setIsSortPickerOpen(false)
                }}
                title="Sort Sales"
                options={[
                    { id: 'date-desc', label: 'DATE (NEWEST FIRST)' },
                    { id: 'date-asc', label: 'DATE (OLDEST FIRST)' },
                    { id: 'amount-high', label: 'AMOUNT (HIGH TO LOW)' },
                    { id: 'amount-low', label: 'AMOUNT (LOW TO HIGH)' },
                ]}
                selectedValue={`${sortBy}-${sortOrder === 'desc' && sortBy === 'amount' ? 'high' : sortOrder === 'asc' && sortBy === 'amount' ? 'low' : sortOrder}`}
            />

            <PickerModal
                isOpen={isFilterPickerOpen}
                onClose={() => setIsFilterPickerOpen(false)}
                onSelect={(val) => {
                    setStatusFilter(val)
                    setIsFilterPickerOpen(false)
                }}
                title="Filter by Status"
                options={[
                    { id: 'ALL', label: 'ALL STATUS' },
                    { id: 'PAID', label: 'PAID' },
                    { id: 'PENDING', label: 'PENDING' },
                    { id: 'UNPAID', label: 'UNPAID' }
                ]}
                selectedValue={statusFilter}
            />

            {/* Grid - Ultra Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredInvoices.map((invoice) => (
                    <div
                        key={invoice.id}
                        onClick={() => handleEdit(invoice)}
                        className="glass p-2.5 rounded-xl group hover:bg-white/60 transition-all duration-300 border border-white/40 cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center shadow-inner transition-transform group-hover:rotate-3">
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-[10px] font-bold text-[var(--deep-contrast)] leading-none">{invoice.invoice_number}</h3>
                                    <div className="flex items-center gap-1 opacity-40">
                                        <Calendar className="h-2 w-2" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest">{new Date(invoice.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={clsx(
                                    "text-[7px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md border",
                                    invoice.status === 'PAID' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200" :
                                        invoice.status === 'PENDING' ? "bg-amber-100/50 text-amber-700 border-amber-200" :
                                            "bg-slate-100/50 text-slate-700 border-slate-200"
                                )}>
                                    {invoice.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-1.5 pt-1.5 border-t border-[var(--primary-green)]/5">
                            <div className="flex items-center gap-1.5">
                                <div className="h-4 w-4 rounded-full bg-[var(--primary-green)]/10 flex items-center justify-center text-[var(--primary-green)] shadow-inner">
                                    <User className="h-2 w-2" />
                                </div>
                                <span className="text-[9px] font-bold text-[var(--foreground)]/60 truncate max-w-[100px]">{invoice.party?.name || 'Walk-in Customer'}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-bold uppercase tracking-widest text-[var(--foreground)]/30 mb-0.5">Grand Total</p>
                                <p className="text-xs font-bold text-[var(--deep-contrast)] tracking-tight">{formatCurrency(invoice.total_amount)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredInvoices.length === 0 && (
                <div className="text-center py-10 opacity-30">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No invoices found</p>
                </div>
            )}
        </div>
    )
}
