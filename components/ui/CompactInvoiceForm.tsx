'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Loader2, CheckCircle2, Wallet, Calculator, Paperclip, Image, X, Building } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import AddSalesItemModal from '@/components/ui/AddSalesItemModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

type InvoiceFormProps = {
    parties?: any[]
    items?: any[]
    paymentModes?: any[]
    initialData?: any
    initialLineItems?: any[]
}

type InvoiceItem = {
    itemId: string
    name: string
    unit: string
    quantity: number
    rate: number
    purchasePrice: number
    tax: number
    amount: number
}

export default function CompactInvoiceForm({ parties = [], items = [], paymentModes = [], initialData, initialLineItems }: InvoiceFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const isEdit = !!initialData
    const isSale = initialData ? initialData.type === 'SALE' : true // Default to true if creating from sales route

    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

    // Data State (Client-side fetch if props missing)
    const [fetchedParties, setFetchedParties] = useState<any[]>(parties)
    const [fetchedItems, setFetchedItems] = useState<any[]>(items)
    const [fetchedModes, setFetchedModes] = useState<any[]>(paymentModes)

    useEffect(() => {
        async function loadLookupData() {
            if (parties.length === 0 || items.length === 0 || paymentModes.length === 0) {
                // Only fetch if initial props were empty (likely static export)
                // Note: This logic assumes if one is empty, we might need all or just specific ones.
                // For safety/simplicity, we can check each or just re-fetch all if any major one is missing & we expect them.
                // Better: Check individually.
            }

            if (parties.length === 0) {
                const { data } = await supabase.from('parties').select('*').in('type', ['CUSTOMER', 'BOTH']).order('name')
                if (data) setFetchedParties(data)
            }
            if (items.length === 0) {
                const { data } = await supabase.from('items').select('*').order('name')
                if (data) setFetchedItems(data)
            }
            if (paymentModes.length === 0) {
                const { data } = await supabase.from('payment_modes').select('*').order('name')
                if (data) setFetchedModes(data)
            }
        }

        loadLookupData()
    }, [parties.length, items.length, paymentModes.length])

    // Use fetched data preferentially if props were empty
    const displayParties = parties.length > 0 ? parties : fetchedParties
    const displayItems = items.length > 0 ? items : fetchedItems
    const displayModes = paymentModes.length > 0 ? paymentModes : fetchedModes

    // Form State
    const [partyId, setPartyId] = useState(initialData?.party_id || '')
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || 'INV-' + Math.floor(Math.random() * 10000))
    const [paymentMode, setPaymentMode] = useState<string>('UNPAID')
    const [rows, setRows] = useState<InvoiceItem[]>(initialLineItems?.map(item => ({
        itemId: item.item_id,
        name: item.description,
        unit: item.items?.unit || '',
        quantity: item.quantity,
        rate: item.rate,
        purchasePrice: item.purchase_price || 0,
        tax: (item.tax_amount / (item.quantity * item.rate)) * 100 || 0,
        amount: item.total
    })) || [])
    const [notes, setNotes] = useState(initialData?.notes || '')
    const [receivedAmount, setReceivedAmount] = useState<number | string>('')
    const [discount, setDiscount] = useState<number | string>(initialData?.discount_amount || '')
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed') // Default to fixed if editing
    const [invoiceTax, setInvoiceTax] = useState<number | string>(initialData?.tax_amount ? ((initialData.tax_amount / (initialData.total_amount - initialData.tax_amount)) * 100).toFixed(1) : '')
    const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || [])
    const [isAddBankOpen, setIsAddBankOpen] = useState(false)
    const [newBankName, setNewBankName] = useState('')
    const [addingBank, setAddingBank] = useState(false)
    const [dueDate, setDueDate] = useState(initialData?.due_date || '')
    const [isFullyReceived, setIsFullyReceived] = useState(false)
    const [modeBalances, setModeBalances] = useState<Record<string, number>>({})

    const { activeBusinessId, formatCurrency } = useBusiness()

    // Filter data by active business
    const filteredParties = displayParties.filter(p => p.business_id === activeBusinessId)
    const filteredItems = displayItems.filter(i => i.business_id === activeBusinessId)
    const filteredPaymentModes = displayModes.filter(m => m.business_id === activeBusinessId)

    const subtotal = rows.reduce((sum, row) => sum + (row.quantity * row.rate), 0)
    const itemTax = rows.reduce((sum, row) => sum + ((row.quantity * row.rate) * (row.tax / 100)), 0)

    // Apply discount
    const discountValue = Number(discount) || 0
    const discountAmount = discountType === 'percent'
        ? (subtotal * discountValue / 100)
        : discountValue

    // Apply invoice-level tax (on subtotal after discount)
    const invoiceTaxValue = Number(invoiceTax) || 0
    const invoiceTaxAmount = (subtotal - discountAmount) * (invoiceTaxValue / 100)

    const totalTax = itemTax + invoiceTaxAmount
    const totalAmount = subtotal + totalTax - discountAmount

    const totalCost = rows.reduce((sum, row) => sum + (row.quantity * (row.purchasePrice || 0)), 0)
    const projectedProfit = subtotal - totalCost - discountAmount
    const isTotalLoss = projectedProfit < 0

    const numReceived = Number(receivedAmount) || 0
    const balanceDue = Math.max(0, totalAmount - numReceived)
    const changeAmount = Math.max(0, numReceived - totalAmount)

    const handleAddItem = (itemData: any) => {
        if (editingItemIndex !== null) {
            const newRows = [...rows]
            newRows[editingItemIndex] = itemData
            setRows(newRows)
            setEditingItemIndex(null)
        } else {
            setRows([...rows, itemData])
        }
        setIsAddModalOpen(false)
    }

    const openEditModal = (index: number) => {
        setEditingItemIndex(index)
        setIsAddModalOpen(true)
    }

    const updateRow = (index: number, field: keyof InvoiceItem, value: any) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }
        if (field === 'quantity' || field === 'rate') {
            newRows[index].amount = newRows[index].quantity * newRows[index].rate
        }
        setRows(newRows)
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    // Fetch Mode Balances
    useEffect(() => {
        if (activeBusinessId) {
            const fetchBalances = async () => {
                const { data } = await supabase
                    .from('transactions')
                    .select('amount, mode, type')
                    .eq('business_id', activeBusinessId)

                if (data) {
                    const balances = data.reduce((acc: any, tx) => {
                        const amount = Number(tx.amount) || 0
                        const change = tx.type === 'RECEIPT' ? amount : -amount
                        acc[tx.mode] = (acc[tx.mode] || 0) + change
                        return acc
                    }, {})
                    setModeBalances(balances)
                }
            }
            fetchBalances()
        }
    }, [activeBusinessId])

    // Effect to sync received amount when fully received is ON
    const [prevTotal, setPrevTotal] = useState(totalAmount)
    if (isFullyReceived && prevTotal !== totalAmount) {
        setPrevTotal(totalAmount)
        setReceivedAmount(totalAmount)
    }

    const handleAddBank = async () => {
        if (!newBankName.trim() || !activeBusinessId) return
        setAddingBank(true)
        try {
            const { data, error } = await supabase
                .from('payment_modes')
                .insert({
                    business_id: activeBusinessId,
                    name: newBankName.trim().toUpperCase()
                })
                .select()
                .single()

            if (error) throw error
            setPaymentMode(data.name)
            setNewBankName('')
            setIsAddBankOpen(false)
        } catch (error: any) {
            alert('Error adding bank: ' + error.message)
        } finally {
            setAddingBank(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || !activeBusinessId) return

        for (const file of Array.from(files)) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${activeBusinessId}/${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(fileName, file)

            if (error) {
                console.error('Upload error:', error)
                continue
            }

            const { data: urlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(fileName)

            if (urlData) {
                setAttachments(prev => [...prev, urlData.publicUrl])
            }
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const handleDelete = async () => {
        if (!initialData?.id || !activeBusinessId) return
        setDeleting(true)
        try {
            // 1. Reverse stock
            for (const item of initialLineItems || []) {
                if (item.item_id) {
                    const { data: dbItem } = await supabase.from('items').select('stock_quantity').eq('id', item.item_id).single()
                    if (dbItem) {
                        const multiplier = isSale ? 1 : -1
                        const newStock = (dbItem.stock_quantity || 0) + (item.quantity * multiplier)
                        await supabase.from('items').update({ stock_quantity: newStock }).eq('id', item.item_id)
                    }
                }
            }

            // 2. Delete invoice (cascade will handle items and transactions usually, but let's be safe if RLS/Triggers differ)
            const { error } = await supabase.from('invoices').delete().eq('id', initialData.id)
            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push(isSale ? '/dashboard/sales' : '/dashboard/purchases')
                router.refresh()
            }, 1000)
        } catch (err: any) {
            alert('Error deleting: ' + err.message)
        } finally {
            setDeleting(false)
            setIsConfirmOpen(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusinessId || !partyId || rows.length === 0) return
        setLoading(true)

        try {
            if (isEdit) {
                // UPDATE FLOW
                // 1. Reverse old stock
                for (const item of initialLineItems || []) {
                    if (item.item_id) {
                        const { data: dbItem } = await supabase.from('items').select('stock_quantity').eq('id', item.item_id).single()
                        if (dbItem) {
                            const multiplier = isSale ? 1 : -1
                            const newStock = (dbItem.stock_quantity || 0) + (item.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', item.item_id)
                        }
                    }
                }

                // 2. Delete old items
                const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', initialData.id)
                if (deleteError) throw deleteError

                // 3. Recalculate Balance
                const { data: transactions } = await supabase.from('transactions').select('amount, type').eq('invoice_id', initialData.id)
                const netPaidOrReceived = transactions?.reduce((acc, t) => {
                    const amount = Number(t.amount) || 0
                    if (isSale) {
                        return acc + (t.type === 'RECEIPT' ? amount : -amount)
                    } else {
                        return acc + (t.type === 'PAYMENT' ? amount : -amount)
                    }
                }, 0) || 0
                const newBalance = totalAmount - netPaidOrReceived

                let status = 'UNPAID'
                if (newBalance <= 0) status = 'PAID'
                else if (netPaidOrReceived > 0) status = 'PARTIAL'

                // 4. Update Invoice
                const { error: invoiceError } = await supabase
                    .from('invoices')
                    .update({
                        party_id: partyId,
                        invoice_number: invoiceNumber,
                        date: date,
                        due_date: dueDate || null,
                        total_amount: totalAmount,
                        balance_amount: newBalance,
                        status: status,
                        notes: notes,
                        discount_amount: discountAmount,
                        tax_amount: invoiceTaxAmount,
                        attachments: attachments
                    })
                    .eq('id', initialData.id)

                if (invoiceError) throw invoiceError

                // 5. Insert new items
                const newInvoiceItems = rows.map(row => ({
                    invoice_id: initialData.id,
                    item_id: row.itemId,
                    description: row.name,
                    quantity: row.quantity,
                    rate: row.rate,
                    tax_amount: (row.quantity * row.rate) * (row.tax / 100),
                    total: row.amount,
                    purchase_price: row.purchasePrice
                }))

                const { error: itemsError } = await supabase.from('invoice_items').insert(newInvoiceItems)
                if (itemsError) throw itemsError

                // 6. Apply new stock
                for (const row of rows) {
                    if (row.itemId) {
                        const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', row.itemId).single()
                        if (item) {
                            const multiplier = isSale ? -1 : 1
                            const newStock = (item.stock_quantity || 0) + (row.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', row.itemId)
                        }
                    }
                }
            } else {
                // CREATE FLOW (Existing logic)
                const isPaid = paymentMode !== 'UNPAID'
                const actualReceived = isPaid ? numReceived : 0
                const currentBalance = isPaid ? balanceDue : totalAmount
                const finalInvoiceNumber = invoiceNumber.trim() || 'INV-' + Math.floor(Math.random() * 100000)

                let status = 'UNPAID'
                if (isPaid) {
                    if (numReceived >= totalAmount) status = 'PAID'
                    else if (numReceived > 0) status = 'PARTIAL'
                }

                const { data: invoice, error: invoiceError } = await supabase
                    .from('invoices')
                    .insert({
                        business_id: activeBusinessId,
                        party_id: partyId,
                        invoice_number: finalInvoiceNumber,
                        date: date,
                        due_date: dueDate || null,
                        total_amount: totalAmount,
                        balance_amount: currentBalance,
                        type: isSale ? 'SALE' : 'PURCHASE',
                        status: status,
                        notes: notes,
                        discount_amount: discountAmount,
                        tax_amount: invoiceTaxAmount,
                        attachments: attachments
                    })
                    .select()
                    .single()

                if (invoiceError) throw invoiceError

                const invoiceItems = rows.map(row => ({
                    invoice_id: invoice.id,
                    item_id: row.itemId,
                    description: row.name,
                    quantity: row.quantity,
                    rate: row.rate,
                    tax_amount: (row.quantity * row.rate) * (row.tax / 100),
                    total: row.amount,
                    purchase_price: row.purchasePrice
                }))

                const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
                if (itemsError) throw itemsError

                if (isPaid && actualReceived > 0) {
                    const { error: txError } = await supabase.from('transactions').insert({
                        business_id: activeBusinessId,
                        party_id: partyId,
                        invoice_id: invoice.id,
                        amount: Math.min(actualReceived, totalAmount),
                        type: isSale ? 'RECEIPT' : 'PAYMENT',
                        mode: paymentMode,
                        date: date,
                        description: `${isSale ? 'Sale' : 'Purchase'} ${finalInvoiceNumber}${status === 'PARTIAL' ? ' (Partial Payment)' : ''}`
                    })
                    if (txError) throw txError
                }

                for (const row of rows) {
                    if (row.itemId) {
                        const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', row.itemId).single()
                        if (item) {
                            const multiplier = isSale ? -1 : 1
                            const newStock = (item.stock_quantity || 0) + (row.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', row.itemId)
                        }
                    }
                }
            }

            setSuccess(true)
            setTimeout(() => {
                router.push(isSale ? '/dashboard/sales' : '/dashboard/purchases')
                router.refresh()
            }, 1000)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center pb-20">
                <div className="glass rounded-2xl border border-white/40 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-bold text-[var(--deep-contrast)] uppercase tracking-tight">{isSale ? 'Invoice' : 'Bill'} {isEdit ? 'Updated' : 'Created'}!</h2>
                    <p className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase mt-1">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-3 max-w-6xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--primary-green)]/10">
                    <div className="flex items-center gap-2">
                        <Link href={isSale ? "/dashboard/sales" : "/dashboard/purchases"} className="p-2 rounded-xl bg-white/50 border border-white/10 hover:bg-[var(--primary-green)] hover:text-white transition-all">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xs lg:text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">
                                {isEdit ? 'Edit' : 'New'} {isSale ? 'Sale' : 'Purchase'}
                            </h1>
                            <p className="text-[10px] lg:text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-1">
                                {isEdit ? 'Update existing record' : 'Invoice Creation'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(true)}
                                disabled={loading || deleting}
                                className="flex items-center gap-1.5 px-3 py-2 lg:py-1.5 rounded-xl bg-rose-50 text-rose-500 text-[10px] lg:text-[9px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                            >
                                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !partyId || rows.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2 lg:py-1.5 rounded-xl bg-[var(--primary-green)] text-white text-[10px] lg:text-[9px] font-bold uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg active:scale-95 h-9 lg:h-auto"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            {isEdit ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    {/* Left: Basic Info */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="glass rounded-xl border border-white/40 p-3">
                            <h3 className="text-[10px] lg:text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-3">Basic Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">{isSale ? 'Customer' : 'Supplier'} *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsPartyPickerOpen(true)}
                                        className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold text-left hover:border-[var(--primary-green)] transition-all flex items-center"
                                    >
                                        {filteredParties.find(p => p.id === partyId)?.name || 'Select...'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[9px] lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">{isSale ? 'Invoice' : 'Bill'} #</label>
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Date</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full h-10 lg:h-7 rounded-lg bg-white/50 border border-white/20 px-3 text-[11px] lg:text-[9px] font-bold focus:border-[var(--primary-green)] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-xl border border-white/40 p-3 space-y-3">
                            <div>
                                <label className="block text-[10px] lg:text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Payment Mode</label>
                                <div className="flex gap-2 lg:gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsModePickerOpen(true)}
                                        className={clsx(
                                            "flex-1 h-11 lg:h-8 rounded-lg border px-3 text-[11px] lg:text-[9px] font-bold flex items-center justify-center transition-all shadow-sm",
                                            paymentMode === 'UNPAID' ? "bg-slate-100/50 border-slate-200 text-slate-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                        )}
                                    >
                                        <Wallet className="h-4 w-4 lg:h-3 lg:w-3 mr-2 lg:mr-1.5 opacity-40" />
                                        {paymentMode === 'UNPAID' ? 'UNPAID' : paymentMode}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBankOpen(true)}
                                        className="h-11 lg:h-8 px-3 lg:px-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-blue-500 hover:bg-blue-100 transition-all flex items-center justify-center"
                                        title="Add Bank"
                                    >
                                        <Building className="h-4 w-4 lg:h-3 lg:w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Add Bank Mini Modal */}
                        {isAddBankOpen && (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 animate-in slide-in-from-top-2">
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-blue-600/60 mb-1.5">New Bank/Mode Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBankName}
                                        onChange={(e) => setNewBankName(e.target.value)}
                                        placeholder="e.g. M-PESA..."
                                        className="flex-1 h-9 rounded-lg bg-white border border-blue-200 px-3 text-[11px] font-bold uppercase focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddBank}
                                        disabled={addingBank || !newBankName.trim()}
                                        className="px-3 h-7 rounded-lg bg-blue-500 text-white text-[8px] font-bold uppercase disabled:opacity-50"
                                    >
                                        {addingBank ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBankOpen(false)}
                                        className="h-7 w-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-400"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentMode !== 'UNPAID' && (
                            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-1 ml-1">
                                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">{isSale ? 'Amount Received' : 'Amount Paid'}</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newState = !isFullyReceived
                                            setIsFullyReceived(newState)
                                            if (newState) setReceivedAmount(totalAmount)
                                        }}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all",
                                            isFullyReceived
                                                ? "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/30 text-[var(--primary-green)]"
                                                : "bg-white/50 border-white/20 text-[var(--foreground)]/30 hover:text-[var(--primary-green)]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "h-2 w-2 rounded-full border border-current flex items-center justify-center",
                                            isFullyReceived && "bg-current"
                                        )}>
                                            {isFullyReceived && <div className="h-1 w-1 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-wider">Fully Received</span>
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <input
                                        type="number"
                                        step="any"
                                        value={receivedAmount}
                                        onChange={(e) => {
                                            setReceivedAmount(e.target.value)
                                            setIsFullyReceived(false)
                                        }}
                                        placeholder="Enter amount..."
                                        className="w-full h-8 rounded-lg bg-white/60 border border-[var(--primary-green)]/20 px-3 text-[10px] font-bold focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                    />
                                    <div className="flex justify-between px-1">
                                        <span className="text-[7px] font-bold uppercase text-black/30">
                                            {numReceived >= totalAmount ? 'Change' : 'Balance Due'}
                                        </span>
                                        <span className={clsx(
                                            "text-[9px] font-bold font-mono",
                                            numReceived >= totalAmount ? "text-blue-500" : "text-rose-500"
                                        )}>
                                            {formatCurrency(numReceived >= totalAmount ? changeAmount : balanceDue)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Discount & Tax Inputs */}
                        <div className="pt-2 border-t border-black/5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1 ml-1">Discount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-8 rounded-lg bg-white/60 border border-orange-200 px-3 text-[10px] font-bold focus:border-orange-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1 ml-1">Tax (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={invoiceTax}
                                        onChange={(e) => setInvoiceTax(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-8 rounded-lg bg-white/60 border border-emerald-200 px-3 text-[10px] font-bold focus:border-emerald-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="pt-2 border-t border-black/5">
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Attachments</label>
                            <div className="flex flex-wrap gap-1.5">
                                {attachments.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <div className="h-10 w-10 rounded-lg bg-white/60 border border-white/20 overflow-hidden">
                                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(i)}
                                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                ))}
                                <label className="h-10 w-10 rounded-lg border border-dashed border-gray-300 bg-white/30 flex items-center justify-center cursor-pointer hover:bg-white/50 transition-all">
                                    <Plus className="h-4 w-4 text-gray-400" />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-black/5">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                <span className="text-[var(--foreground)]/40">Subtotal</span>
                                <span className="text-[var(--deep-contrast)]">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                <span className="text-[var(--foreground)]/40">Taxation</span>
                                <span className="text-[var(--deep-contrast)]">{formatCurrency(totalTax)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-orange-500">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {isSale && (
                                <div className={clsx(
                                    "flex justify-between text-[9px] font-bold uppercase tracking-wider p-2 rounded-lg bg-black/5 mt-1",
                                    isTotalLoss ? "text-rose-600" : "text-blue-600"
                                )}>
                                    <span>{isTotalLoss ? 'Projected Loss' : 'Projected Profit'}</span>
                                    <span>{formatCurrency(projectedProfit)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-lg font-bold text-[var(--deep-contrast)] pt-3 border-t border-[var(--primary-green)]/10 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider pt-0.5">Grand Total</span>
                                <span className={clsx(
                                    "px-3 py-1 rounded-xl bg-[var(--primary-green)]/10",
                                    paymentMode !== 'UNPAID' ? "text-[var(--primary-green)]" : "text-[var(--deep-contrast)]"
                                )}>
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Items */}
                    <div className="lg:col-span-3">
                        <div className="glass rounded-xl border border-white/40 overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/10 bg-[var(--primary-green)]/5 flex justify-between items-center">
                                <h3 className="text-[10px] lg:text-[9px] font-bold uppercase tracking-wider text-[var(--deep-contrast)]">Items ({rows.length})</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary-green)] text-white text-[10px] lg:text-[8px] font-bold uppercase hover:bg-[var(--primary-hover)] transition-all h-8 lg:h-auto"
                                >
                                    <Plus className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
                                    Add
                                </button>
                            </div>

                            <div className="p-3 space-y-3 lg:space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {rows.length === 0 ? (
                                    <div className="text-center py-12 lg:py-8 opacity-30">
                                        <p className="text-[10px] lg:text-[8px] font-bold uppercase tracking-wider">No items added yet</p>
                                    </div>
                                ) : (
                                    rows.map((row, index) => (
                                        <div
                                            key={index}
                                            onClick={() => openEditModal(index)}
                                            className="group relative glass p-3 lg:p-2 rounded-xl lg:rounded-lg border border-white/30 hover:bg-white/60 transition-all cursor-pointer active:scale-[0.98]"
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeRow(index); }}
                                                className="absolute -top-1.5 -right-1.5 p-1 lg:p-0.5 bg-white rounded-full border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all z-10 shadow-sm"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 lg:h-2.5 lg:w-2.5" />
                                            </button>

                                            <div className="flex flex-col sm:grid sm:grid-cols-5 gap-3 lg:gap-2 items-start sm:items-center">
                                                <div className="w-full sm:col-span-2">
                                                    <div className="text-[11px] lg:text-[9px] font-bold text-[var(--deep-contrast)] truncate">{row.name}</div>
                                                    <div className={clsx(
                                                        "text-[9px] lg:text-[7px] font-bold uppercase tracking-wider",
                                                        (row.rate - (row.purchasePrice || 0)) < 0 ? "text-rose-500" : "text-blue-500"
                                                    )}>
                                                        Profit: {formatCurrency((row.rate - (row.purchasePrice || 0)) * row.quantity)}
                                                    </div>
                                                </div>
                                                <div className="flex w-full gap-2 sm:contents">
                                                    <div className="flex-1 sm:flex-none">
                                                        <label className="block text-[8px] lg:text-[7px] font-bold uppercase text-[var(--foreground)]/30 mb-1 ml-1">Qty × {row.unit}</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={row.quantity}
                                                            onChange={(e) => updateRow(index, 'quantity', Number(e.target.value))}
                                                            className="w-full h-10 lg:h-7 rounded-lg bg-white/40 border border-white/10 px-2 text-[11px] lg:text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="flex-1 sm:flex-none">
                                                        <label className="block text-[8px] lg:text-[7px] font-bold uppercase text-[var(--foreground)]/30 mb-1 ml-1">Rate/{row.unit}</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={row.rate}
                                                            onChange={(e) => updateRow(index, 'rate', Number(e.target.value))}
                                                            className="w-full h-10 lg:h-7 rounded-lg bg-white/40 border border-white/10 px-2 text-[11px] lg:text-[9px] font-bold text-center focus:border-[var(--primary-green)] focus:outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="flex-1 sm:flex-none">
                                                        <label className="block text-[8px] lg:text-[7px] font-bold uppercase text-[var(--foreground)]/30 mb-1 ml-1 text-right">Total</label>
                                                        <div className="h-10 lg:h-7 flex items-center justify-end px-2 rounded-lg bg-[var(--primary-green)]/10 text-[11px] lg:text-[9px] font-bold text-[var(--primary-green)] border border-[var(--primary-green)]/10">
                                                            {formatCurrency(row.amount)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-3">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Internal notes & comments..."
                                className="w-full h-24 lg:h-16 rounded-xl glass border border-white/40 p-3 text-[11px] lg:text-[9px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none resize-none placeholder-[var(--foreground)]/20"
                            />
                        </div>
                    </div>
                </div>
            </form>

            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={setPartyId}
                title="Select Customer"
                options={filteredParties.map(p => ({ id: p.id, label: p.name, subLabel: p.phone }))}
                selectedValue={partyId}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={setPaymentMode}
                title="Payment Mode"
                options={[
                    { id: 'UNPAID', label: 'MARK AS UNPAID' },
                    { id: 'CASH', label: 'CASH', subLabel: formatCurrency(modeBalances['CASH'] || 0) },
                    { id: 'BANK', label: 'BANK', subLabel: formatCurrency(modeBalances['BANK'] || 0) },
                    { id: 'ONLINE', label: 'ONLINE', subLabel: formatCurrency(modeBalances['ONLINE'] || 0) },
                    ...filteredPaymentModes.map(m => ({
                        id: m.name,
                        label: m.name,
                        subLabel: formatCurrency(modeBalances[m.name] || 0)
                    }))
                ]}
                selectedValue={paymentMode}
            />

            <AddSalesItemModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingItemIndex(null)
                }}
                onAdd={handleAddItem}
                items={filteredItems}
                initialData={editingItemIndex !== null && editingItemIndex >= 0 ? rows[editingItemIndex] : null}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title={`Delete ${isSale ? 'Sale' : 'Purchase'}?`}
                message={`Are you sure you want to permanently delete this ${isSale ? 'sale' : 'purchase'}? This will also reverse all stock changes.`}
                confirmText="Delete"
                cancelText="Keep It"
            />
        </>
    )
}
