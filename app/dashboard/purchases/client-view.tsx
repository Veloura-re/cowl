'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, Search, ShoppingCart, Calendar, User, Filter, ArrowUpDown, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import { createClient } from '@/utils/supabase/client'
import { printInvoice, InvoiceData, downloadInvoice } from '@/utils/invoice-generator'
import { currencies } from '@/lib/currencies'
import InvoicePreviewModal from '@/components/ui/InvoicePreviewModal'

export default function PurchasesClientView({ initialInvoices }: { initialInvoices?: any[] }) {
    const router = useRouter()
    const { activeBusinessId, formatCurrency, businesses } = useBusiness()
    const [invoices, setInvoices] = useState(initialInvoices || [])
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient() // Create client instance here if not existing, or use existing

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!activeBusinessId) {
                console.log('PurchasesClientView: No active business, skipping fetch')
                setLoading(false)
                return
            }

            setLoading(true)
            console.log('PurchasesClientView: Fetching fresh purchases for business:', activeBusinessId)
            const { data, error } = await supabase
                .from('invoices')
                .select('*, party:parties(name, phone, address)')
                .eq('business_id', activeBusinessId)
                .eq('type', 'PURCHASE')
                .order('date', { ascending: false })

            if (error) {
                console.error('PurchasesClientView: Error fetching purchases', error)
            }
            if (data) {
                console.log('PurchasesClientView: Fetched', data.length, 'purchases')
                setInvoices(data)
            }
            setLoading(false)
        }
        fetchInvoices()
    }, [activeBusinessId])
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isSortPickerOpen, setIsSortPickerOpen] = useState(false)
    const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false)
    const [loading, setLoading] = useState(!initialInvoices)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<InvoiceData | null>(null)

    const handleEdit = (invoice: any) => {
        router.push(`/dashboard/purchases/edit?id=${invoice.id}`)
    }

    const handlePrintInvoice = async (e: React.MouseEvent, invoice: any) => {
        e.stopPropagation() // Prevent card click

        try {
            // Fetch invoice items
            const { data: items } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', invoice.id)

            // Get business info
            const activeBusiness = businesses.find(b => b.id === activeBusinessId)
            const currencyCode = (activeBusiness as any)?.currency || 'USD'
            const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol || '$'

            const invoiceData: InvoiceData = {
                invoiceNumber: invoice.invoice_number,
                date: invoice.date,
                dueDate: invoice.due_date,
                type: 'PURCHASE',
                businessName: activeBusiness?.name || 'Business',
                businessAddress: (activeBusiness as any)?.address,
                businessPhone: (activeBusiness as any)?.phone,
                partyName: invoice.party?.name || 'Walk-in Customer',
                partyAddress: invoice.party?.address,
                partyPhone: invoice.party?.phone,
                items: items?.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    tax: ((item.tax_amount / (item.quantity * item.rate)) * 100) || 0,
                    total: item.total
                })) || [],
                subtotal: items?.reduce((sum, item) => sum + (item.quantity * item.rate), 0) || 0,
                taxAmount: invoice.tax_amount || 0,
                discountAmount: invoice.discount_amount || 0,
                totalAmount: invoice.total_amount,
                status: invoice.status,
                paidAmount: invoice.total_amount - invoice.balance_amount,
                balanceAmount: invoice.balance_amount,
                notes: invoice.notes,
                currency: currencyCode,
                currencySymbol: currencySymbol
            }

            setPreviewData(invoiceData)
            setIsPreviewOpen(true)
        } catch (error) {
            console.error('Error generating invoice:', error)
        }
    }

    const handlePrint = () => {
        if (previewData) {
            printInvoice(previewData)
        }
    }

    const handleDownload = () => {
        if (previewData) {
            downloadInvoice(previewData)
        }
    }

    // Purchases are already filtered by business_id at the database level
    let filteredPurchases = invoices.filter((inv) =>
        (inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.party?.name && inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ) && (statusFilter === 'ALL' || inv.status === statusFilter)
    )

    // Sort
    filteredPurchases = [...filteredPurchases].sort((a, b) => {
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
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div>
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Purchases</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Stock Inward Log</p>
                </div>
                <motion.button
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/dashboard/purchases/new')}
                    className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-orange-600 transition-all shadow-xl shadow-[var(--deep-contrast)]/20 active:scale-95 border border-white/10 group"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                    <span>New Bill</span>
                </motion.button>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex gap-2">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        statusFilter === 'PAID' ? "bg-emerald-500/10 border-emerald-500/50" : "border-white/40 hover:bg-white/60"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600/60">Paid Bills</span>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded uppercase tracking-tighter">Done</span>
                    </div>
                    <p className="text-sm font-black text-emerald-600 mt-1 tabular-nums">
                        {formatCurrency(invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0))}
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatusFilter(statusFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        statusFilter === 'UNPAID' ? "bg-rose-500/10 border-rose-500/50" : "border-white/40 hover:bg-white/60"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-600/60">To Pay</span>
                        </div>
                        <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1 rounded uppercase tracking-tighter">DUE</span>
                    </div>
                    <p className="text-sm font-black text-rose-600 mt-1 tabular-nums">
                        {formatCurrency(invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.total_amount, 0))}
                    </p>
                </motion.div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                    <input
                        type="text"
                        placeholder="Search bills..."
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
                    onClick={() => setIsFilterPickerOpen(true)}
                    className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                >
                    <Filter className="h-3 w-3 opacity-40" />
                    <span>Filter</span>
                </button>
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
                title="Sort Purchase Bills"
                showSearch={false}
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
                showSearch={false}
                options={[
                    { id: 'ALL', label: 'ALL STATUS' },
                    { id: 'PAID', label: 'PAID' },
                    { id: 'PARTIAL', label: 'PARTIAL' },
                    { id: 'UNPAID', label: 'UNPAID' }
                ]}
                selectedValue={statusFilter}
            />

            {/* Grid - Ultra Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredPurchases.map((inv: any) => (
                    <div
                        key={inv.id}
                        onClick={() => handleEdit(inv)}
                        className="group relative flex flex-col glass rounded-[14px] border border-white/40 p-2 hover:bg-white/60 transition-all duration-500 cursor-pointer overflow-hidden"
                    >
                        {/* Status Stripe */}
                        <div className={clsx(
                            "absolute top-0 left-0 w-1.5 h-full",
                            inv.status === 'PAID' ? "bg-emerald-500" :
                                inv.status === 'PARTIAL' ? "bg-amber-500" : "bg-rose-500"
                        )} />

                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <User className="h-2.5 w-2.5 text-orange-600/40 shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-[11px] font-black text-[var(--deep-contrast)] truncate">{inv.party?.name || 'Walk-in'}</h3>
                                    <span className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{new Date(inv.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={clsx(
                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border shadow-sm",
                                    inv.status === 'PAID' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200" :
                                        inv.status === 'PARTIAL' ? "bg-amber-100/50 text-amber-700 border-amber-200" :
                                            "bg-rose-100/50 text-rose-700 border-rose-200"
                                )}>
                                    {inv.status}
                                </span>
                                <button
                                    onClick={(e) => handlePrintInvoice(e, inv)}
                                    className="p-1 rounded bg-white border border-slate-100 text-[var(--foreground)]/30 hover:text-orange-600 transition-all active:scale-95"
                                >
                                    <Printer className="h-2.5 w-2.5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[var(--primary-green)]/10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <ShoppingCart className="h-2.5 w-2.5 text-orange-600/40 shrink-0" />
                                <span className="text-[10px] font-bold text-[var(--deep-contrast)]/60 truncate uppercase tracking-tighter">#{inv.invoice_number}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <p className={clsx(
                                    "text-[13px] font-black tracking-tighter tabular-nums",
                                    inv.balance_amount > 0 ? "text-rose-600" : "text-emerald-600"
                                )}>
                                    {formatCurrency(inv.total_amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-20">
                    <LoadingSpinner label="Fetching Bills..." />
                </div>
            ) : filteredPurchases.length === 0 && (
                <div className="text-center py-10 opacity-30">
                    <p className="text-[10px] font-bold uppercase tracking-wider">No bills found</p>
                </div>
            )}
            {isPreviewOpen && previewData && (
                <InvoicePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    data={previewData}
                    onPrint={handlePrint}
                    onDownload={handleDownload}
                />
            )}
        </div >
    )
}
