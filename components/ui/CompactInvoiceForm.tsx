'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Loader2, CheckCircle2, Wallet, Calculator, Paperclip, Image as ImageIcon, X, Building, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import AddSalesItemModal from '@/components/ui/AddSalesItemModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { printInvoice, InvoiceData, downloadInvoice } from '@/utils/invoice-generator'
import { currencies } from '@/lib/currencies'
import SignaturePad, { SignaturePadHandle } from '@/components/ui/signature-pad'
import InvoicePreviewModal from '@/components/ui/InvoicePreviewModal'

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
    const isEdit = !!initialData?.id
    const isSale = initialData ? initialData.type === 'SALE' : true

    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<InvoiceData | null>(null)

    // Data State (Client-side fetch if props missing)
    const [fetchedParties, setFetchedParties] = useState<any[]>(parties)
    const [fetchedItems, setFetchedItems] = useState<any[]>(items)
    const [fetchedModes, setFetchedModes] = useState<any[]>(paymentModes)

    useEffect(() => {
        async function loadLookupData() {
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
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed')
    const [invoiceTax, setInvoiceTax] = useState<number | string>(initialData?.tax_amount ? ((initialData.tax_amount / (initialData.total_amount - initialData.tax_amount)) * 100).toFixed(1) : '')
    const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || [])
    const [isAddBankOpen, setIsAddBankOpen] = useState(false)
    const [newBankName, setNewBankName] = useState('')
    const [addingBank, setAddingBank] = useState(false)
    const [dueDate, setDueDate] = useState(initialData?.due_date || '')
    const [isFullyReceived, setIsFullyReceived] = useState(false)
    const [modeBalances, setModeBalances] = useState<Record<string, number>>({})
    const sigPadRef = useRef<SignaturePadHandle>(null)

    const { activeBusinessId, formatCurrency, businesses } = useBusiness()

    // Filter data by active business
    const filteredParties = displayParties.filter(p => p.business_id === activeBusinessId)
    const filteredItems = displayItems.filter(i => i.business_id === activeBusinessId)
    const filteredPaymentModes = displayModes.filter(m => m.business_id === activeBusinessId)

    const subtotal = rows.reduce((sum, row) => sum + (row.quantity * row.rate), 0)
    const itemTax = rows.reduce((sum, row) => sum + ((row.quantity * row.rate) * (row.tax / 100)), 0)

    const discountValue = Number(discount) || 0
    const discountAmount = discountType === 'percent'
        ? (subtotal * discountValue / 100)
        : discountValue

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

    const handlePreview = () => {
        const activeBusiness = businesses.find(b => b.id === activeBusinessId)
        const currencyCode = (activeBusiness as any)?.currency || 'USD'
        const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol || '$'
        const selectedParty = displayParties.find(p => p.id === partyId)
        const signature = sigPadRef.current?.toDataURL() || undefined

        const invoiceData: InvoiceData = {
            invoiceNumber: invoiceNumber,
            date: date,
            dueDate: dueDate,
            type: isSale ? 'SALE' : 'PURCHASE',
            businessName: activeBusiness?.name || 'Business',
            businessAddress: (activeBusiness as any)?.address,
            businessPhone: (activeBusiness as any)?.phone,
            partyName: selectedParty?.name || 'Walk-in Customer',
            partyAddress: selectedParty?.address,
            partyPhone: selectedParty?.phone,
            items: rows.map(row => ({
                description: row.name,
                quantity: row.quantity,
                rate: row.rate,
                tax: row.tax,
                total: row.amount
            })),
            subtotal: subtotal,
            taxAmount: totalTax,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            status: initialData?.status || 'UNPAID',
            paidAmount: totalAmount - balanceDue,
            balanceAmount: balanceDue,
            notes: notes,
            currency: currencyCode,
            currencySymbol: currencySymbol,
            signature: signature || undefined,
            attachments: attachments
        }
        setPreviewData(invoiceData)
        setIsPreviewOpen(true)
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

    const handleDelete = async () => {
        if (!initialData?.id || !activeBusinessId) return
        setDeleting(true)
        try {
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

            const { error } = await supabase.from('invoices').delete().eq('id', initialData.id)
            if (error) throw error

            setSuccess(true)
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                router.push(isSale ? '/dashboard/sales' : '/dashboard/purchases')
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
        const cleanUUID = (id: any) => (id && id !== 'undefined' && id !== '') ? id : null
        const currentPartyId = cleanUUID(partyId)
        const business_id = cleanUUID(activeBusinessId)

        if (!business_id || !currentPartyId || rows.length === 0) return
        setLoading(true)

        try {
            if (isEdit) {
                // UPDATE FLOW
                for (const item of initialLineItems || []) {
                    if (item.item_id) {
                        const { data: dbItem } = await supabase.from('items').select('stock_quantity').eq('id', cleanUUID(item.item_id)).single()
                        if (dbItem) {
                            const multiplier = isSale ? 1 : -1
                            const newStock = (dbItem.stock_quantity || 0) + (item.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', cleanUUID(item.item_id))
                        }
                    }
                }

                const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', cleanUUID(initialData.id))
                if (deleteError) throw deleteError

                const { data: transactions } = await supabase.from('transactions').select('amount, type').eq('invoice_id', cleanUUID(initialData.id))
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

                const { error: invoiceError } = await supabase
                    .from('invoices')
                    .update({
                        party_id: currentPartyId,
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
                    .eq('id', cleanUUID(initialData.id))

                if (invoiceError) throw invoiceError

                const newInvoiceItems = rows.map(row => ({
                    invoice_id: cleanUUID(initialData.id),
                    item_id: cleanUUID(row.itemId),
                    description: row.name,
                    quantity: row.quantity,
                    rate: row.rate,
                    tax_amount: (row.quantity * row.rate) * (row.tax / 100),
                    total: row.amount,
                    purchase_price: row.purchasePrice
                }))

                const { error: itemsError } = await supabase.from('invoice_items').insert(newInvoiceItems)
                if (itemsError) throw itemsError

                for (const row of rows) {
                    if (row.itemId) {
                        const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', cleanUUID(row.itemId)).single()
                        if (item) {
                            const multiplier = isSale ? -1 : 1
                            const newStock = (item.stock_quantity || 0) + (row.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', cleanUUID(row.itemId))
                        }
                    }
                }
            } else {
                // CREATE FLOW
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
                        business_id,
                        party_id: currentPartyId,
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
                    item_id: cleanUUID(row.itemId),
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
                        business_id,
                        party_id: currentPartyId,
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
                        const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', cleanUUID(row.itemId)).single()
                        if (item) {
                            const multiplier = isSale ? -1 : 1
                            const newStock = (item.stock_quantity || 0) + (row.quantity * multiplier)
                            await supabase.from('items').update({ stock_quantity: newStock }).eq('id', cleanUUID(row.itemId))
                        }
                    }
                }
            }

            setSuccess(true)
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                router.push(isSale ? '/dashboard/sales' : '/dashboard/purchases')
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
                <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-8 text-center shadow-2xl">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-black text-[var(--deep-contrast)] uppercase tracking-tight">{isSale ? 'Invoice' : 'Bill'} {isEdit ? 'Updated' : 'Created'}</h2>
                    <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-1">Executing Redirection...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-6xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                    <div className="flex items-center gap-2">
                        <Link href={isSale ? "/dashboard/sales" : "/dashboard/purchases"} className="p-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xs font-black text-[var(--deep-contrast)] uppercase tracking-tight">
                                {isEdit ? 'Edit' : 'New'} {isSale ? 'Ledger' : 'Purchase'}
                            </h1>
                            <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">
                                UID: {invoiceNumber}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--deep-contrast)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--foreground)]/10 transition-all shadow-sm active:scale-95"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                        </button>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(true)}
                                disabled={loading || deleting}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/5 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all shadow-sm active:scale-95"
                            >
                                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !partyId || rows.length === 0}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {isEdit ? 'Update' : 'Commit'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Left: Basic Info */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-4 shadow-lg">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-3 border-b border-[var(--foreground)]/5 pb-2">Entry Metadata</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">{isSale ? 'Client Account' : 'Vendor Account'} *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsPartyPickerOpen(true)}
                                        className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[10px] font-black text-left hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                                    >
                                        <span className="truncate">{filteredParties.find(p => p.id === partyId)?.name || 'SELECT ACCOUNT...'}</span>
                                        <Plus className="h-3.5 w-3.5 opacity-20" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Reference UID</label>
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Entry Date</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-4 space-y-4 shadow-lg">
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Liquidation Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModePickerOpen(true)}
                                        className={clsx(
                                            "flex-1 h-10 rounded-xl border px-4 text-[9px] font-black flex items-center justify-center transition-all shadow-sm",
                                            paymentMode === 'UNPAID' ? "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 text-[var(--foreground)]/30" : "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/30 text-[var(--primary-green)]"
                                        )}
                                    >
                                        <Wallet className="h-3.5 w-3.5 mr-2 opacity-40" />
                                        {paymentMode}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBankOpen(true)}
                                        className="h-10 px-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                                        title="Attach Bank"
                                    >
                                        <Building className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {isAddBankOpen && (
                                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-in slide-in-from-top-2">
                                    <label className="block text-[7px] font-black uppercase tracking-widest text-blue-600/60 mb-1.5 ml-1">Define New Mode</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newBankName}
                                            onChange={(e) => setNewBankName(e.target.value)}
                                            placeholder="..."
                                            className="flex-1 h-8 rounded-lg bg-[var(--background)]/50 border border-blue-500/20 px-3 text-[10px] font-black uppercase focus:outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddBank}
                                            disabled={addingBank || !newBankName.trim()}
                                            className="px-3 h-8 rounded-lg bg-blue-500 text-white text-[8px] font-black uppercase disabled:opacity-50 active:scale-95 shadow-sm"
                                        >
                                            {addingBank ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Set'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddBankOpen(false)}
                                            className="h-8 w-8 rounded-lg bg-white/50 border border-blue-500/20 flex items-center justify-center text-blue-400 active:scale-95"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {paymentMode !== 'UNPAID' && (
                                <div className="pt-2 animate-in slide-in-from-top-2 duration-400">
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30">{isSale ? 'Credit Received' : 'Balance Settled'}</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newState = !isFullyReceived
                                                setIsFullyReceived(newState)
                                                if (newState) setReceivedAmount(totalAmount)
                                            }}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all active:scale-95",
                                                isFullyReceived
                                                    ? "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/30 text-[var(--primary-green)] shadow-sm"
                                                    : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:text-[var(--primary-green)]"
                                            )}
                                        >
                                            <div className={clsx(
                                                "h-2 w-2 rounded-full border border-current flex items-center justify-center",
                                                isFullyReceived && "bg-current"
                                            )}>
                                                {isFullyReceived && <div className="h-1 w-1 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-[7px] font-black uppercase tracking-wider">Lump Sum</span>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={receivedAmount}
                                            onChange={(e) => {
                                                setReceivedAmount(e.target.value)
                                                setIsFullyReceived(false)
                                            }}
                                            placeholder="0.00"
                                            className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--primary-green)]/20 px-4 text-[11px] font-black focus:border-[var(--primary-green)] transition-all shadow-inner tabular-nums"
                                        />
                                        <div className="flex justify-between px-1">
                                            <span className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/20">
                                                {numReceived >= totalAmount ? 'EXCESS' : 'ARREARS'}
                                            </span>
                                            <span className={clsx(
                                                "text-[10px] font-black font-mono tracking-tighter tabular-nums",
                                                numReceived >= totalAmount ? "text-blue-500" : "text-rose-500"
                                            )}>
                                                {formatCurrency(numReceived >= totalAmount ? changeAmount : balanceDue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t border-[var(--foreground)]/5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Discount</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            placeholder="0"
                                            className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-orange-500/20 px-3 text-[10px] font-black focus:border-orange-500 shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1.5 ml-1">Tax (%)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={invoiceTax}
                                            onChange={(e) => setInvoiceTax(e.target.value)}
                                            placeholder="0"
                                            className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-emerald-500/20 px-3 text-[10px] font-black focus:border-emerald-500 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-4 shadow-lg">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Authentication Pad</label>
                            <div className="rounded-2xl overflow-hidden border border-dashed border-[var(--primary-green)]/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm relative group">
                                <SignaturePad ref={sigPadRef} className="h-32" />
                                <button
                                    type="button"
                                    onClick={() => sigPadRef.current?.clear()}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-4 shadow-lg">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Supporting Evidence</label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <div className="h-12 w-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 overflow-hidden shadow-sm">
                                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Paperclip className="h-4 w-4 text-[var(--foreground)]/20" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(i)}
                                            className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 z-10"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="h-12 w-12 rounded-xl border border-dashed border-[var(--foreground)]/20 bg-[var(--foreground)]/5 flex items-center justify-center cursor-pointer hover:bg-[var(--foreground)]/10 hover:border-[var(--primary-green)]/30 transition-all active:scale-95 group shadow-sm">
                                    <Plus className="h-4 w-4 text-[var(--foreground)]/20 group-hover:text-[var(--primary-green)]" />
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

                        <div className="space-y-2 pt-4 border-t border-[var(--foreground)]/5">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/30 px-1">
                                <span>Subtotal</span>
                                <span className="text-[var(--deep-contrast)] tabular-nums">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/30 px-1">
                                <span>Accumulated Tax</span>
                                <span className="text-[var(--deep-contrast)] tabular-nums">{formatCurrency(totalTax)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-orange-600 px-1">
                                    <span>Discount (Applied)</span>
                                    <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {isSale && (
                                <div className={clsx(
                                    "flex justify-between text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-xl border mt-2",
                                    isTotalLoss ? "bg-rose-500/5 border-rose-500/10 text-rose-500" : "bg-blue-500/5 border-blue-500/10 text-blue-500"
                                )}>
                                    <span>{isTotalLoss ? 'PROJECTED LOSS' : 'PROJECTED MARGIN'}</span>
                                    <span className="tabular-nums font-mono">{formatCurrency(projectedProfit)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-black text-[var(--deep-contrast)] pt-3 border-t border-[var(--primary-green)]/20 mt-3 px-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Total</span>
                                <span className={clsx(paymentMode !== 'UNPAID' ? "text-[var(--primary-green)] drop-shadow-sm font-mono tracking-tighter" : "font-mono tracking-tighter")}>
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Items */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="glass rounded-[32px] border border-[var(--foreground)]/10 overflow-hidden min-h-[500px] shadow-2xl">
                            <div className="px-6 py-4 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Active Inventory Log</h3>
                                    <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">{rows.length} RECORDED ENTRIES</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[10px] font-black uppercase tracking-[0.1em] hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95 group"
                                >
                                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-500" />
                                    GENERATE LINE
                                </button>
                            </div>

                            <div className="p-4 space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {rows.length === 0 ? (
                                    <div className="text-center py-32 opacity-20">
                                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ledger is empty</p>
                                    </div>
                                ) : (
                                    rows.map((row, index) => (
                                        <div
                                            key={index}
                                            onClick={() => openEditModal(index)}
                                            className="group relative p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 transition-all cursor-pointer active:scale-[0.99] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="h-10 w-10 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/10 group-hover:scale-110 transition-transform">
                                                    <Calculator size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase truncate tracking-tight">{row.name}</h4>
                                                    <div className={clsx(
                                                        "text-[8px] font-black uppercase tracking-wider mt-0.5",
                                                        (row.rate - (row.purchasePrice || 0)) < 0 ? "text-rose-500" : "text-blue-500"
                                                    )}>
                                                        PROFIT PER UNIT: {formatCurrency(row.rate - (row.purchasePrice || 0))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--foreground)]/5">
                                                <div className="flex gap-4">
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-0.5">Quantity</p>
                                                        <p className="text-[11px] font-black text-[var(--deep-contrast)] tabular-nums">{row.quantity} {row.unit}</p>
                                                    </div>
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-0.5">Rate</p>
                                                        <p className="text-[11px] font-black text-[var(--deep-contrast)] tabular-nums">{formatCurrency(row.rate)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4 border-l border-[var(--foreground)]/10">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-0.5">Valuation</p>
                                                    <p className="text-[14px] font-black text-[var(--primary-green)] tabular-nums font-mono tracking-tighter">{formatCurrency(row.amount)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeRow(index); }}
                                                    className="p-2 rounded-xl bg-rose-500/5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white z-10 active:scale-95 shadow-sm border border-rose-500/10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="relative group shadow-xl">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="ENTER INTERNAL MEMORANDUM..."
                                className="w-full h-32 rounded-[32px] glass border border-[var(--foreground)]/10 p-6 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none resize-none placeholder:text-[var(--foreground)]/20 transition-all shadow-inner"
                            />
                            <div className="absolute top-4 right-6 pointer-events-none opacity-10">
                                <Paperclip size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={setPartyId}
                title="Select Account"
                options={filteredParties.map(p => ({ id: p.id, label: p.name.toUpperCase(), subLabel: p.phone }))}
                selectedValue={partyId}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={setPaymentMode}
                title="Liquidation Mode"
                options={[
                    { id: 'UNPAID', label: 'MARK AS UNPAID' },
                    { id: 'CASH', label: 'PHYSICAL CASH', subLabel: formatCurrency(modeBalances['CASH'] || 0) },
                    { id: 'BANK', label: 'BANK ACCOUNT', subLabel: formatCurrency(modeBalances['BANK'] || 0) },
                    { id: 'ONLINE', label: 'ONLINE GATEWAY', subLabel: formatCurrency(modeBalances['ONLINE'] || 0) },
                    ...filteredPaymentModes.map(m => ({
                        id: m.name,
                        label: m.name.toUpperCase(),
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
                title={`Purge ${isSale ? 'Entry' : 'Record'}?`}
                message={`Permanently purge this ledger entry? All associated stock changes will be immediatey reversed. This action is irreversible.`}
                confirmText="Purge"
                variant="danger"
            />

            {isPreviewOpen && previewData && (
                <InvoicePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    data={previewData}
                    onPrint={handlePrint}
                    onDownload={handleDownload}
                />
            )}
        </>
    )
}
