'use client'

import React, { useState, useEffect } from 'react'

// ... existing code ...


import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, Search, ShoppingCart, Calendar, User, Filter, ArrowUpDown, Printer, Edit2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { useBusiness } from '@/context/business-context'
import { Loader2 } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PickerModal from '@/components/ui/PickerModal'
import { createClient } from '@/utils/supabase/client'
import { printInvoice, InvoiceData, downloadInvoice } from '@/utils/invoice-generator'
import { currencies } from '@/lib/currencies'
import UnifiedControlBar from '@/components/ui/UnifiedControlBar'
import FilterSortModal from '@/components/ui/FilterSortModal'

const InvoicePreviewModal = dynamic(() => import('@/components/ui/InvoicePreviewModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary-green)]" /></div>
})

export default function PurchasesClientView({ initialInvoices }: { initialInvoices?: any[] }) {
    const router = useRouter()
    const { activeBusinessId, formatCurrency, businesses } = useBusiness()
    const { resolvedTheme } = useTheme()
    const theme = (resolvedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'
    const [invoices, setInvoices] = useState(initialInvoices || [])
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!activeBusinessId) {
                setLoading(false)
                return
            }

            setLoading(true)
            const { data, error } = await supabase
                .from('invoices')
                .select('id, invoice_number, date, total_amount, balance_amount, status, party:parties(name)')
                .eq('business_id', activeBusinessId)
                .eq('type', 'PURCHASE')
                .order('date', { ascending: false })

            if (error) {
                console.error('PurchasesClientView: Error fetching purchases', error)
            }
            if (data) {
                setInvoices(data)
            }
            setLoading(false)
        }
        fetchInvoices()
    }, [activeBusinessId])

    // Real-time Subscription
    useEffect(() => {
        if (!activeBusinessId) return

        const channel = supabase
            .channel(`purchases_${activeBusinessId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'invoices',
                    filter: `business_id=eq.${activeBusinessId}`
                },
                async (payload) => {
                    const data = (payload.new || payload.old) as any
                    if (data && data.type !== 'PURCHASE') return

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        let partyData = null
                        if (data.party_id) {
                            const { data: p } = await supabase
                                .from('parties')
                                .select('name')
                                .eq('id', data.party_id)
                                .single()
                            partyData = p
                        }

                        const updatedInvoice = {
                            ...data,
                            party: partyData ? { name: partyData.name } : null
                        }

                        if (payload.eventType === 'INSERT') {
                            setInvoices(prev => [updatedInvoice, ...prev])
                        } else {
                            setInvoices(prev => prev.map(inv => inv.id === data.id ? { ...inv, ...updatedInvoice } : inv))
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setInvoices(prev => prev.filter(inv => inv.id === payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeBusinessId, supabase])

    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isOrganizeOpen, setIsOrganizeOpen] = useState(false)
    const [loading, setLoading] = useState(!initialInvoices)
    const [visibleCount, setVisibleCount] = useState(50)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<InvoiceData | null>(null)

    const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null)

    const handleTouchStart = (invoice: any) => {
        longPressTimer.current = setTimeout(() => {
            setInvoiceToDelete(invoice)
            setIsDeleteConfirmOpen(true)
        }, 800) // 800ms long press
    }

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
        }
    }

    const confirmDelete = async () => {
        if (!invoiceToDelete) return
        setIsDeleting(true)
        const id = invoiceToDelete.id

        try {
            // 1. Fetch Items for Stock Reversion
            const { data: invoiceItems } = await supabase.from('invoice_items').select('*').eq('invoice_id', id)

            // 2. Revert Stock
            if (invoiceItems) {
                for (const item of invoiceItems) {
                    if (item.item_id) {
                        const { data: dbItem } = await supabase.from('items').select('stock_quantity').eq('id', item.item_id).maybeSingle()
                        if (dbItem) {
                            // For PURCHASE: We INCREASED stock, so deleting means substracting
                            // If user bought 10 items, removing the invoice means we remove 10 items from stock
                            const newStock = (dbItem.stock_quantity || 0) - item.quantity
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', item.item_id)
                        }
                    }
                }
            }

            // 3. Cascade Delete
            await supabase.from('transactions').delete().eq('invoice_id', id)
            await supabase.from('invoice_items').delete().eq('invoice_id', id)
            const { error } = await supabase.from('invoices').delete().eq('id', id)

            if (error) throw error

            // Update UI
            setInvoices(prev => prev.filter(i => i.id !== id))
            setIsDeleteConfirmOpen(false)
            setInvoiceToDelete(null)
        } catch (error: any) {
            console.error('Delete error:', error)
            alert('Failed to delete: ' + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    // handleEdit removed - editing disabled

    const handlePrintInvoice = async (e: React.MouseEvent, invoice: any) => {
        e.stopPropagation()

        try {
            const { data: items } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', invoice.id)

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
                businessLogoUrl: (activeBusiness as any)?.logo_url,
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
                currencySymbol: currencySymbol,
                accentColor: (activeBusiness as any)?.invoice_accent_color,
                footerNote: (activeBusiness as any)?.invoice_footer_note,
                size: (activeBusiness as any)?.invoice_size
            }

            setPreviewData(invoiceData)
            setIsPreviewOpen(true)
        } catch (error) {
            console.error('Error generating invoice:', error)
        }
    }

    const handlePrint = () => {
        if (previewData) {
            printInvoice(previewData, theme)
        }
    }

    const handleDownload = () => {
        if (previewData) {
            downloadInvoice(previewData, true, theme)
        }
    }

    let filteredPurchases = invoices.filter((inv) =>
        (inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.party?.name && inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ) && (statusFilter === 'ALL' || inv.status === statusFilter)
    )

    filteredPurchases = [...filteredPurchases].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1
        if (sortBy === 'date') {
            return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
        } else {
            return multiplier * (a.total_amount - b.total_amount)
        }
    })

    const handleEdit = (id: string) => {
        router.push(`/dashboard/purchases/edit?id=${id}`)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Purchase</h1>
                        <p className="text-[10px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Purchase Log</p>
                    </div>
                    <motion.button
                        id="new-purchase-btn"
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard/purchases/new')}
                        className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 border border-[var(--primary-foreground)]/10 group"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-300" />
                        <span>New Entry</span>
                    </motion.button>
                </div>

                <UnifiedControlBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOrganizeClick={() => setIsOrganizeOpen(true)}
                />
            </div>

            {/* Quick Stats Bar */}
            <div id="purchases-stats" className="flex gap-2">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        statusFilter === 'PAID'
                            ? "bg-[var(--status-success)] border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/50 scale-[1.02]"
                            : "bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--status-success-foreground)]/60">Total Out</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-success-border)] bg-[var(--status-success)] text-[var(--status-success-foreground)] shadow-sm">DONE</span>
                    </div>
                    <p className="text-xs font-black text-[var(--status-success-foreground)] mt-1 tabular-nums">
                        {formatCurrency(invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0))}
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatusFilter(statusFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        statusFilter === 'UNPAID'
                            ? "bg-[var(--status-danger)] border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/50 scale-[1.02]"
                            : "bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--status-danger-foreground)]/60">To Pay</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-danger-border)] bg-[var(--status-danger)] text-[var(--status-danger-foreground)] shadow-sm">DUE</span>
                    </div>
                    <p className="text-xs font-black text-[var(--status-danger-foreground)] mt-1 tabular-nums">
                        {formatCurrency(invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.total_amount, 0))}
                    </p>
                </motion.div>
            </div>

            <FilterSortModal
                isOpen={isOrganizeOpen}
                onClose={() => setIsOrganizeOpen(false)}
                selectedSort={`${sortBy}-${sortOrder}`}
                selectedFilter={statusFilter}
                onSortSelect={(val) => {
                    const [by, order] = val.split('-')
                    setSortBy(by as 'date' | 'amount')
                    setSortOrder(order as 'asc' | 'desc')
                }}
                onFilterSelect={(val) => setStatusFilter(val)}
                sortOptions={[
                    { id: 'date-desc', label: 'NEWEST FIRST' },
                    { id: 'date-asc', label: 'OLDEST FIRST' },
                    { id: 'amount-desc', label: 'AMOUNT: HIGH TO LOW' },
                    { id: 'amount-asc', label: 'AMOUNT: LOW TO HIGH' },
                ]}
                filterOptions={[
                    { id: 'ALL', label: 'ALL PURCHASES' },
                    { id: 'PAID', label: 'PAID ONLY' },
                    { id: 'PARTIAL', label: 'PARTIAL ONLY' },
                    { id: 'UNPAID', label: 'UNPAID ONLY' }
                ]}
            />

            {/* Grid - Ultra Compact Cards */}
            <motion.div
                id="purchases-list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
            >
                <AnimatePresence mode="popLayout">
                    {filteredPurchases.slice(0, visibleCount).map((inv: any) => (
                        <motion.div
                            key={inv.id}
                            layout
                            variants={itemVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleEdit(inv.id)}
                            onMouseDown={() => handleTouchStart(inv)}
                            onMouseUp={handleTouchEnd}
                            onMouseLeave={handleTouchEnd}
                            onTouchStart={() => handleTouchStart(inv)}
                            onTouchEnd={handleTouchEnd}
                            className="group relative flex items-center glass-optimized rounded-[10px] border border-[var(--foreground)]/10 p-1.5 hover:bg-[var(--foreground)]/10 transition-all duration-300 cursor-pointer overflow-hidden h-[44px] gap-2 select-none active:scale-[0.98]"
                        >
                            {/* Status Indicator Stripe */}
                            <div className={clsx(
                                "absolute top-0 left-0 w-[2px] h-full transition-colors duration-300",
                                inv.status === 'PAID' ? "bg-emerald-500" : "bg-rose-500"
                            )} />

                            {/* Avatar */}
                            <div className={clsx(
                                "h-6 w-6 rounded-lg flex items-center justify-center font-black text-[9px] transition-all duration-300 shadow-inner shrink-0 border uppercase",
                                inv.status === 'UNPAID'
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                    : "bg-[var(--foreground)]/5 text-[var(--deep-contrast)]/60 border-[var(--foreground)]/10"
                            )}>
                                {(inv.party?.name || 'S').charAt(0)}
                            </div>

                            {/* Identity & Status Header - Compact */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <h3 className="text-[9px] font-black text-[var(--deep-contrast)] truncate leading-none uppercase tracking-tight">{inv.party?.name || 'Supplier'}</h3>
                                    <span className={clsx(
                                        "text-[5.5px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md border shrink-0",
                                        inv.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                                            inv.status === 'PENDING' ? "bg-amber-500/10 text-amber-500 border-amber-500/10" :
                                                "bg-rose-500/10 text-rose-500 border-rose-500/10"
                                    )}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[6px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.1em]">{inv.invoice_number}</span>
                                    <div className="h-0.5 w-0.5 rounded-full bg-[var(--foreground)]/20" />
                                    <span className="text-[6px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.1em]">
                                        {new Date(inv.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            </div>

                            {/* Value & Actions Row */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <p className={clsx(
                                    "text-[11px] font-black tracking-tighter tabular-nums leading-none",
                                    inv.balance_amount > 0 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                    {formatCurrency(inv.total_amount)}
                                </p>
                                <div className="flex items-center gap-1 transition-opacity">
                                    <button
                                        onClick={(e) => handlePrintInvoice(e, inv)}
                                        className="h-4 w-4 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-[var(--primary-green)] hover:text-white border border-[var(--foreground)]/10 transition-all"
                                    >
                                        <Printer size={7} />
                                    </button>
                                    {/* Edit button removed */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setInvoiceToDelete(inv)
                                            setIsDeleteConfirmOpen(true)
                                        }}
                                        className="h-4 w-4 flex items-center justify-center rounded-md bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-rose-500 hover:text-white border border-[var(--foreground)]/10 transition-all"
                                    >
                                        <Trash2 size={7} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredPurchases.length > visibleCount && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="px-4 py-2 rounded-xl bg-[var(--foreground)]/5 text-[10px] font-black uppercase tracking-wider hover:bg-[var(--foreground)]/10 transition-all"
                    >
                        Load More ({filteredPurchases.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Remove Record?"
                message="This will delete the entry and update stock. This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Permanently"}
            />

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <LoadingSpinner label="Fetching Bills..." />
                    <p className="text-[8px] font-bold text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-3">Accessing Ledger Archives</p>
                </div>
            ) : filteredPurchases.length === 0 && (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-300">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No bills found</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Record a purchase to update your inventory</p>
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
