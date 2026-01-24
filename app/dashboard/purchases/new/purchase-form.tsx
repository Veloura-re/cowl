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
    const [isAddBankOpen, setIsAddBankOpen] = useState(false)
    const [newBankName, setNewBankName] = useState('')
    const [addingBank, setAddingBank] = useState(false)

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
    const changeAmount = Math.max(0, numPaid - totalAmount)

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
        <div className="space-y-4 max-w-4xl mx-auto pb-20 px-4 sm:px-0 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/purchases" className="p-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xs font-black text-[var(--deep-contrast)] uppercase tracking-tight">Record Bill</h1>
                        <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">Stock Entry</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 h-9 text-[10px] font-black uppercase tracking-wider text-[var(--deep-contrast)] hover:bg-[var(--foreground)]/10 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Save & Print</span>
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-6 h-9 text-[10px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                        Save Bill
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Left: Metadata */}
                <div className="md:col-span-1 space-y-3">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                        <div className="px-4 py-2.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5">
                            <h3 className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Metadata</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Supplier</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPartyPickerOpen(true)}
                                    className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all shadow-inner text-left flex items-center justify-between"
                                >
                                    <span className="truncate">{filteredParties.find(p => p.id === partyId)?.name || 'Select Supplier'}</span>
                                    <Plus className="h-3.5 w-3.5 opacity-20" />
                                </button>
                            </div>
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Bill Reference</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all placeholder:text-[var(--foreground)]/20"
                                    placeholder="BILL-000"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-4 space-y-4 shadow-lg">
                        <div>
                            <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Payment Mode</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModePickerOpen(true)}
                                    className={clsx(
                                        "flex-1 h-10 rounded-xl border px-3 text-[10px] font-black flex items-center justify-center transition-all shadow-sm",
                                        paymentMode === 'UNPAID' ? "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 text-[var(--foreground)]/30" : "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/30 text-[var(--primary-green)]"
                                    )}
                                >
                                    <Wallet className="h-3.5 w-3.5 mr-2 opacity-40" />
                                    {paymentMode === 'UNPAID' ? 'MARK UNPAID' : paymentMode}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddBankOpen(true)}
                                    className="h-10 px-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all active:scale-95"
                                    title="Add Bank"
                                >
                                    <Building className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Add Bank Mini Modal */}
                        {isAddBankOpen && (
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-in slide-in-from-top-2">
                                <label className="block text-[7px] font-black uppercase tracking-wider text-blue-600/60 mb-1.5">New Mode Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBankName}
                                        onChange={(e) => setNewBankName(e.target.value)}
                                        placeholder="Bank..."
                                        className="flex-1 h-8 rounded-lg bg-[var(--background)]/80 border border-blue-500/30 px-3 text-[10px] font-black uppercase focus:outline-none text-[var(--deep-contrast)]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddBank}
                                        disabled={addingBank || !newBankName.trim()}
                                        className="px-3 h-8 rounded-lg bg-blue-500 text-white text-[9px] font-black uppercase disabled:opacity-50 active:scale-95"
                                    >
                                        {addingBank ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBankOpen(false)}
                                        className="h-8 w-8 rounded-lg bg-[var(--background)]/80 border border-blue-500/30 flex items-center justify-center text-blue-400 active:scale-95"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentMode !== 'UNPAID' && (
                            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Amount Paid</label>
                                <div className="space-y-1.5">
                                    <input
                                        type="number"
                                        step="any"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="Enter amount..."
                                        className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--primary-green)]/20 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                    />
                                    <div className="flex justify-between px-1">
                                        <span className="text-[7px] font-black uppercase tracking-wider text-[var(--foreground)]/30">
                                            {numPaid >= totalAmount ? 'Change' : 'Balance Due'}
                                        </span>
                                        <span className={clsx(
                                            "text-[10px] font-black tabular-nums font-mono tracking-tighter",
                                            numPaid >= totalAmount ? "text-blue-500" : "text-rose-500"
                                        )}>
                                            {formatCurrency(numPaid >= totalAmount ? changeAmount : balanceDue)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Discount & Tax Inputs */}
                        <div className="pt-3 border-t border-[var(--foreground)]/5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Discount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-orange-500/20 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-orange-500 focus:outline-none shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 ml-1">Tax (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={invoiceTax}
                                        onChange={(e) => setInvoiceTax(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-emerald-500/20 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-emerald-500 focus:outline-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="pt-3 border-t border-[var(--foreground)]/5">
                            <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Attachments</label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <div className="h-10 w-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 overflow-hidden shadow-sm">
                                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Paperclip className="h-4 w-4 text-[var(--foreground)]/30" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(i)}
                                            className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="h-10 w-10 rounded-xl border border-dashed border-[var(--foreground)]/20 bg-[var(--foreground)]/5 flex items-center justify-center cursor-pointer hover:bg-[var(--foreground)]/10 hover:border-[var(--primary-green)]/30 transition-all active:scale-95">
                                    <Plus className="h-4 w-4 text-[var(--foreground)]/30" />
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

                        <div className="space-y-2 pt-3 border-t border-[var(--foreground)]/10">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-[var(--foreground)]/40 px-1">
                                <span>Subtotal</span>
                                <span className="text-[var(--deep-contrast)]">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-[var(--foreground)]/40 px-1">
                                <span>Taxation</span>
                                <span className="text-[var(--deep-contrast)]">{formatCurrency(totalTax)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-orange-600 px-1">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black text-[var(--deep-contrast)] pt-2 border-t border-[var(--primary-green)]/20 mt-1 px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest pt-1 opacity-40">Total</span>
                                <span className={clsx(paymentMode !== 'UNPAID' ? "text-[var(--primary-green)] drop-shadow-sm" : "")}>
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Items Grid */}
                <div className="md:col-span-3">
                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 overflow-hidden min-h-[400px] shadow-2xl">
                        <div className="px-6 py-4 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Billing Entries</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">{rows.length} Active Items</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsItemModalOpen(true)}
                                className="flex items-center text-[10px] font-black uppercase tracking-wider text-[var(--primary-foreground)] bg-[var(--primary-green)] hover:bg-[var(--primary-hover)] transition-all px-5 py-2 rounded-xl shadow-lg shadow-[var(--primary-green)]/20 active:scale-95 group"
                            >
                                <Plus className="h-4 w-4 mr-1.5 transition-transform group-hover:rotate-90 duration-500" /> Add Item
                            </button>
                        </div>

                        <div className="p-4 space-y-2.5">
                            {rows.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="h-16 w-16 bg-[var(--foreground)]/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[var(--foreground)]/5">
                                        <Plus className="h-8 w-8 text-[var(--foreground)]/10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/20">Cart is currently empty</p>
                                </div>
                            ) : (
                                rows.map((row, index) => (
                                    <div
                                        key={index}
                                        onClick={() => openEditModal(index)}
                                        className="group relative p-4 rounded-2xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 border border-[var(--foreground)]/5 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/20 transition-transform group-hover:scale-110">
                                                <Calculator size={18} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">{row.name}</h4>
                                                <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">
                                                    {row.quantity} {row.unit} × {formatCurrency(row.rate)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Subtotal</p>
                                                <p className="text-[13px] font-black text-[var(--primary-green)] tabular-nums">{formatCurrency(row.amount)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeRow(index); }}
                                                className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 z-10 active:scale-90 border border-rose-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add internal notes for this ledger entry..."
                            className="w-full h-24 rounded-[32px] glass border border-[var(--foreground)]/10 p-5 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none resize-none placeholder:text-[var(--foreground)]/20 shadow-xl transition-all"
                        />
                    </div>
                </div>
            </div>

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
