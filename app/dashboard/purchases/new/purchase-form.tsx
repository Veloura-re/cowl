'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Calculator, Wallet, Paperclip, Image, X, Building, Loader2, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import AddPurchaseItemModal from '@/components/ui/AddPurchaseItemModal'
import { printInvoice, InvoiceData } from '@/utils/invoice-generator'
import { currencies } from '@/lib/currencies'
import SignaturePad from '@/components/ui/signature-pad'

type PurchaseFormProps = {
    parties: any[]
    items: any[]
    paymentModes: any[]
}

type InvoiceItem = {
    itemId: string
    name: string
    unit: string
    quantity: number
    rate: number
    tax: number
    amount: number
}

export default function PurchaseForm({ parties, items, paymentModes }: PurchaseFormProps) {
    const { activeBusinessId, formatCurrency, setIsGlobalLoading, showSuccess, showError, businesses } = useBusiness()

    // Filter data by active business
    const filteredParties = parties.filter(p => p.business_id === activeBusinessId)
    const filteredItems = items.filter(i => i.business_id === activeBusinessId)
    const filteredPaymentModes = paymentModes.filter(m => m.business_id === activeBusinessId)

    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

    // Form State
    const [partyId, setPartyId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [paymentMode, setPaymentMode] = useState<string>('UNPAID')
    const [rows, setRows] = useState<InvoiceItem[]>([])
    const [paidAmount, setPaidAmount] = useState<number | string>('')
    const [discount, setDiscount] = useState<number | string>('')
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [invoiceTax, setInvoiceTax] = useState<number | string>('')
    const [attachments, setAttachments] = useState<string[]>([])
    const [notes, setNotes] = useState('')
    const [dueDate, setDueDate] = useState('')

    // Calculations
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

    const numPaid = Number(paidAmount) || 0
    const balanceDue = Math.max(0, totalAmount - numPaid)

    const handleAddItem = (itemData: any) => {
        if (editingItemIndex !== null) {
            const newRows = [...rows]
            newRows[editingItemIndex] = itemData
            setRows(newRows)
            setEditingItemIndex(null)
        } else {
            setRows([...rows, itemData])
        }
        setIsItemModalOpen(false)
    }

    const openEditModal = (index: number) => {
        setEditingItemIndex(index)
        setIsItemModalOpen(true)
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
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

    const handleSubmit = async (e: React.FormEvent, shouldPrint = false) => {
        if (e) e.preventDefault()
        const cleanUUID = (id: any) => (id && id !== 'undefined' && id !== '') ? id : null
        const currentPartyId = cleanUUID(partyId)
        const business_id = cleanUUID(activeBusinessId)

        if (!currentPartyId) return alert('Select a supplier')

        // Auto-generate bill number if not provided
        const finalInvoiceNumber = invoiceNumber.trim() || 'BILL-' + Math.floor(Math.random() * 100000)

        if (rows.length === 0) return showError('Add at least one item')
        if (!business_id) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
            const isPaid = paymentMode !== 'UNPAID'
            const actualPaid = isPaid ? numPaid : 0
            const currentBalance = isPaid ? balanceDue : totalAmount

            // Determine Status
            let status = 'UNPAID'
            if (isPaid) {
                if (numPaid >= totalAmount) status = 'PAID'
                else if (numPaid > 0) status = 'PARTIAL'
            }

            // 1. Create Bill (Invoices table)
            const { data: bill, error: billError } = await supabase
                .from('invoices')
                .insert({
                    business_id,
                    party_id: currentPartyId,
                    invoice_number: finalInvoiceNumber,
                    date: date,
                    due_date: dueDate || null,
                    total_amount: totalAmount,
                    balance_amount: currentBalance,
                    type: 'PURCHASE',
                    status: status,
                    notes: notes,
                    discount_amount: discountAmount,
                    tax_amount: invoiceTaxAmount,
                    attachments: attachments
                })
                .select()
                .single()

            if (billError) throw billError

            // 2. Create Items
            const invoiceItems = rows.map(row => ({
                invoice_id: bill.id,
                item_id: cleanUUID(row.itemId),
                description: row.name,
                quantity: row.quantity,
                rate: row.rate,
                tax_amount: (row.quantity * row.rate) * (row.tax / 100),
                total: row.amount
            }))

            const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
            if (itemsError) throw itemsError

            // 3. Create Transaction if Paid
            if (isPaid && actualPaid > 0) {
                const { error: txError } = await supabase.from('transactions').insert({
                    business_id,
                    party_id: currentPartyId,
                    invoice_id: bill.id,
                    amount: Math.min(actualPaid, totalAmount),
                    type: 'PAYMENT',
                    mode: paymentMode,
                    date: date,
                    description: `Bill ${finalInvoiceNumber}${status === 'PARTIAL' ? ' (Partial Payment)' : ''}`
                })
                if (txError) throw txError
            }

            // 4. Update Stock
            for (const row of rows) {
                if (row.itemId) {
                    const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', cleanUUID(row.itemId)).single()
                    if (item) {
                        const newStock = (item.stock_quantity || 0) + row.quantity
                        await supabase.from('items').update({ stock_quantity: newStock }).eq('id', cleanUUID(row.itemId))
                    }
                }
            }

            if (shouldPrint) {
                const activeBusiness = businesses.find(b => b.id === activeBusinessId)
                const currencyCode = (activeBusiness as any)?.currency || 'USD'
                const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol || '$'
                const selectedParty = parties.find(p => p.id === partyId)

                const invoiceData: InvoiceData = {
                    invoiceNumber: bill.invoice_number,
                    date: bill.date,
                    dueDate: bill.due_date,
                    type: 'PURCHASE',
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
                    status: status,
                    paidAmount: actualPaid,
                    balanceAmount: currentBalance,
                    notes: notes,
                    currency: currencyCode,
                    currencySymbol: currencySymbol
                }
                printInvoice(invoiceData)
            }

            setIsGlobalLoading(false)
            showSuccess(`Bill ${finalInvoiceNumber} recorded successfully.`)
            router.push('/dashboard/purchases')
            router.refresh()
        } catch (err: any) {
            setIsGlobalLoading(false)
            showError(err.message, 'Bill Failure')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-3 max-w-4xl mx-auto pb-10 px-4 sm:px-0 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/purchases" className="p-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm">
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                    <div>
                        <h1 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Record Bill</h1>
                        <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-wider leading-none">Stock Entry</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 h-8 text-[9px] font-black uppercase tracking-wider text-[var(--deep-contrast)] hover:bg-[var(--foreground)]/10 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        <Printer className="mr-1.5 h-3 w-3" />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-lg bg-[var(--primary-green)] px-4 h-8 text-[9px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-md active:scale-95"
                    >
                        {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
                        Save Bill
                    </button>
                </div>
            </div>

            {/* 0. IDENTITY GATE */}
            {!partyId ? (
                <div className="py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-8 text-center shadow-2xl relative overflow-hidden group">
                        <div className="h-16 w-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                            <Building size={28} strokeWidth={2} />
                        </div>
                        <h2 className="text-sm font-black text-[var(--deep-contrast)] uppercase tracking-tight mb-1">Identity Verification</h2>
                        <p className="text-[9px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em] mb-6 max-w-xs mx-auto leading-tight">Identify vendor to initialize ledger</p>

                        <button
                            type="button"
                            onClick={() => setIsPartyPickerOpen(true)}
                            className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--deep-contrast-hover)] transition-all shadow-xl active:scale-95 group/btn"
                        >
                            Select Vendor
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-400">
                    {/* Active Supplier Header Card */}
                    <div className="glass rounded-[24px] border border-[var(--primary-green)]/20 p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary-green)] text-white flex items-center justify-center shadow-md">
                                <Building size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Vendor</p>
                                <h3 className="text-sm font-black text-[var(--deep-contrast)] uppercase tracking-tight truncate leading-none mt-0.5">
                                    {filteredParties.find(p => p.id === partyId)?.name}
                                </h3>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto relative z-10">
                            <div className="flex-1 md:flex-none">
                                <p className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/20 mb-0.5 ml-1">Reference</p>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full md:w-32 h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all uppercase"
                                    placeholder="UID"
                                />
                            </div>
                            <div className="flex-1 md:flex-none">
                                <p className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/20 mb-0.5 ml-1">Date</p>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-2 text-[10px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPartyPickerOpen(true)}
                                className="h-8 w-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center justify-center text-[var(--foreground)]/30 hover:border-[var(--primary-green)] hover:text-[var(--primary-green)] transition-all mt-auto"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* 1. PRIMARY: Billing Entries (Items) */}
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                        <div className="px-4 py-2.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Line Specification</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest">{rows.length} ENTRIES</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsItemModalOpen(true)}
                                className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[9px] font-black uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 group"
                            >
                                <Plus size={12} />
                                APPEND ITEM
                            </button>
                        </div>

                        <div className="p-2 space-y-1.5">
                            {rows.length === 0 ? (
                                <div className="py-20 text-center opacity-10">
                                    <Calculator className="h-8 w-8 mx-auto mb-3" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Empty Cart</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {rows.map((row, index) => (
                                        <div
                                            key={index}
                                            onClick={() => openEditModal(index)}
                                            className="group relative p-2.5 rounded-xl bg-[var(--foreground)]/3 hover:bg-[var(--foreground)]/7 border border-white/5 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-[var(--primary-green)] text-white flex items-center justify-center shadow-md">
                                                    <Calculator size={14} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">{row.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40">
                                                            {row.quantity} {row.unit} × {formatCurrency(row.rate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[12px] font-black text-[var(--primary-green)] tabular-nums font-mono tracking-tighter">{formatCurrency(row.amount)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeRow(index); }}
                                                    className="p-1.5 rounded-lg bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-90 border border-rose-500/10"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. TERTIARY: Validation & Controls (Bottom Console) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Left: Metadata & Notes */}
                        <div className="space-y-2">
                            <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-3">
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Overlays</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-white/5 space-y-1">
                                        <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 font-mono">ADJ %</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            className="w-full bg-transparent text-[11px] font-black text-[var(--deep-contrast)] focus:outline-none tabular-nums"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-white/5 space-y-1">
                                        <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 font-mono">TAX %</label>
                                        <input
                                            type="number"
                                            value={invoiceTax}
                                            onChange={(e) => setInvoiceTax(e.target.value)}
                                            className="w-full bg-transparent text-[11px] font-black text-[var(--deep-contrast)] focus:outline-none tabular-nums"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md flex flex-col min-h-[100px]">
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 mb-2">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="SPECIFICATIONS..."
                                    className="flex-1 w-full bg-transparent text-[10px] font-black text-[var(--deep-contrast)] focus:outline-none resize-none placeholder:opacity-10 custom-scrollbar"
                                />
                            </div>
                        </div>

                        {/* Center: Signature & Liquidation */}
                        <div className="space-y-2">
                            <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-2">
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Liquidation</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModePickerOpen(true)}
                                        className={clsx(
                                            "flex-1 h-10 rounded-xl border px-3 text-[9px] font-black flex items-center justify-center transition-all shadow-sm",
                                            paymentMode === 'UNPAID' ? "bg-rose-500/5 border-rose-500/10 text-rose-500" : "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/40 text-[var(--primary-green)]"
                                        )}
                                    >
                                        {paymentMode}
                                    </button>
                                </div>
                            </div>

                            <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Sign</label>
                                    <button onClick={() => { }} className="text-[7px] font-black text-rose-500/50 uppercase">Reset</button>
                                </div>
                                <div className="rounded-xl border border-dashed border-[var(--primary-green)]/20 bg-white/5 backdrop-blur-sm overflow-hidden h-20">
                                    <SignaturePad className="h-full" />
                                </div>
                            </div>
                        </div>

                        {/* Right: Evidence (Attachments) */}
                        <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md flex flex-col">
                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 mb-3">Evidence</label>
                            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto custom-scrollbar max-h-[160px]">
                                {attachments.map((url, i) => (
                                    <div key={i} className="relative group/attachment h-12 w-12 rounded-lg border border-white/5 overflow-hidden shadow-sm">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeAttachment(i)} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover/attachment:opacity-100 transition-opacity">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <label className="h-12 w-12 rounded-lg border-2 border-dashed border-[var(--foreground)]/10 bg-[var(--foreground)]/2 flex items-center justify-center cursor-pointer hover:border-[var(--primary-green)]/30 transition-all">
                                    <Plus size={14} className="text-[var(--foreground)]/10" />
                                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={(id) => setPartyId(id)}
                title="Select Supplier"
                options={filteredParties.map(p => ({ id: p.id, label: p.name.toUpperCase(), subLabel: p.phone }))}
                selectedValue={partyId}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={setPaymentMode}
                title="Payment Mode"
                options={[
                    { id: 'UNPAID', label: 'MARK AS UNPAID' },
                    { id: 'CASH', label: 'CASH' },
                    { id: 'BANK', label: 'BANK' },
                    { id: 'ONLINE', label: 'ONLINE' },
                    ...filteredPaymentModes.map(m => ({ id: m.name, label: m.name }))
                ]}
                selectedValue={paymentMode}
            />

            <AddPurchaseItemModal
                isOpen={isItemModalOpen}
                onClose={() => {
                    setIsItemModalOpen(false)
                    setEditingItemIndex(null)
                }}
                onAdd={handleAddItem}
                items={filteredItems}
                initialData={editingItemIndex !== null ? rows[editingItemIndex] : null}
            />
        </div>
    )
}
