'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Loader2, CheckCircle2, Wallet, Calculator, Paperclip, Image as ImageIcon, X, Building, Printer, ChevronDown, ChevronUp } from 'lucide-react'
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
import CreatePartyModal from '@/app/dashboard/parties/create-party-modal'
import { motion, AnimatePresence } from 'framer-motion'

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
    const { activeBusinessId, formatCurrency, businesses } = useBusiness()
    const supabase = useMemo(() => createClient(), [])
    const isEdit = !!initialData?.id
    const isSale = useMemo(() => initialData ? initialData.type === 'SALE' : true, [initialData?.type])

    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isCreatePartyOpen, setIsCreatePartyOpen] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<InvoiceData | null>(null)
    const [itemToRemoveIndex, setItemToRemoveIndex] = useState<number | null>(null)
    const [showTopMore, setShowTopMore] = useState(false)
    const [showBottomMore, setShowBottomMore] = useState(false)

    // Data State (Client-side fetch if props missing)
    const [fetchedParties, setFetchedParties] = useState<any[]>(parties)
    const [fetchedItems, setFetchedItems] = useState<any[]>(items)
    const [fetchedModes, setFetchedModes] = useState<any[]>(paymentModes)

    const fetchParties = useCallback(async () => {
        if (!activeBusinessId) return
        const { data, error } = await supabase
            .from('parties')
            .select('*')
            .eq('business_id', activeBusinessId)
            .order('name')

        if (error) console.error('Error fetching parties:', error)
        if (data) {
            console.log('DEBUG: Parties refreshed:', data.length)
            setFetchedParties(data)
        }
    }, [activeBusinessId, supabase])

    // Initial Fetch & Subscription
    useEffect(() => {
        if (!activeBusinessId) return

        // 1. Initial Load
        fetchParties()

        // 2. Load other lookups (preserve existing logic for items/modes)
        async function loadOthers() {
            if (items.length === 0) {
                const { data } = await supabase.from('items').select('*').eq('business_id', activeBusinessId).order('name')
                if (data) setFetchedItems(data)
            }
            if (paymentModes.length === 0) {
                const { data } = await supabase.from('payment_modes').select('*').eq('business_id', activeBusinessId).order('name')
                if (data) setFetchedModes(data)
            }
        }
        loadOthers()

        // 3. Real-time Subscription
        const channel = supabase
            .channel('parties-auto-sync')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'parties', filter: `business_id=eq.${activeBusinessId}` },
                (payload) => {
                    console.log('Real-time sync triggered:', payload)
                    fetchParties()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [activeBusinessId, supabase, fetchParties, items.length, paymentModes.length])

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



    // Filter data by active business
    // We also do a loose type filter in memory for UI preference, but keep it lenient
    const filteredParties = displayParties
        .filter(p => !activeBusinessId || p.business_id === activeBusinessId)
        .sort((a, b) => {
            // Sort logic: 
            // 1. Matches type (Customer/Supplier)
            // 2. Alphabetical
            const typeA = a.type?.toUpperCase()
            const typeB = b.type?.toUpperCase()
            const preferredType = isSale ? 'CUSTOMER' : 'SUPPLIER'

            const aMatch = typeA === preferredType || typeA === 'BOTH'
            const bMatch = typeB === preferredType || typeB === 'BOTH'

            if (aMatch && !bMatch) return -1
            if (!aMatch && bMatch) return 1
            return a.name.localeCompare(b.name)
        })
    const filteredItems = displayItems.filter(i => !activeBusinessId || i.business_id === activeBusinessId)
    const filteredPaymentModes = displayModes.filter(m => !activeBusinessId || m.business_id === activeBusinessId)

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
        setItemToRemoveIndex(null)
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
            businessLogoUrl: (activeBusiness as any)?.logo_url,
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
        // Robust ID cleaning
        const cleanUUID = (id: any) => (id && id !== 'undefined' && id !== '') ? id : null
        const id = cleanUUID(initialData?.id)

        if (!id || !activeBusinessId) {
            console.error('Delete aborted: Missing ID')
            alert('Cannot delete: Invalid ID. Please refresh and try again.')
            return
        }

        setDeleting(true)
        try {
            console.log('Starting delete for invoice:', id)

            // 1. Revert Stock (Soft Fail)
            for (const item of initialLineItems || []) {
                if (item.item_id) {
                    const { data: dbItem } = await supabase.from('items').select('stock_quantity').eq('id', cleanUUID(item.item_id)).maybeSingle()
                    if (dbItem) {
                        const multiplier = isSale ? 1 : -1
                        const newStock = (dbItem.stock_quantity || 0) + (item.quantity * multiplier)
                        await supabase.from('items').update({ stock_quantity: newStock }).eq('id', cleanUUID(item.item_id))
                    }
                }
            }

            // 2. Cascade Delete Dependencies
            const { error: txError } = await supabase.from('transactions').delete().eq('invoice_id', id)
            if (txError) throw new Error(`Transaction Error: ${txError.message}`)

            const { error: itemsError } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
            if (itemsError) throw new Error(`Items Error: ${itemsError.message}`)

            // 3. Delete Parent Invoice
            const { error } = await supabase.from('invoices').delete().eq('id', id)
            if (error) throw new Error(`Invoice Error: ${error.message}`)

            setSuccess(true)
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                router.push(isSale ? '/dashboard/sales' : '/dashboard/purchases')
            }, 1000)

        } catch (err: any) {
            console.error('Delete Failure:', err)
            // Ensure message is never undefined "nothin edetine"
            alert(`Deletion Failed: ${err.message || 'Unknown Network Error'}`)
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
            <form onSubmit={handleSubmit} className="space-y-2 max-w-6xl mx-auto pb-10 px-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--primary-green)]/10">
                    <div className="flex items-center gap-2">
                        <Link href={isSale ? "/dashboard/sales" : "/dashboard/purchases"} className="p-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm">
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">
                                {isEdit ? 'Edit' : 'New'} {isSale ? 'Ledger' : 'Purchase'}
                            </h1>
                            <p className="text-[8px] font-black text-[var(--foreground)]/60 uppercase tracking-widest leading-none mt-0.5">Specifications Gateway</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--deep-contrast)] text-[8px] font-black uppercase tracking-widest hover:bg-[var(--foreground)]/10 transition-all shadow-sm active:scale-95"
                        >
                            <Printer className="h-3 w-3" />
                            <span className="hidden sm:inline">Preview</span>
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !partyId || rows.length === 0}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[8px] font-black uppercase tracking-widest hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 shadow-md active:scale-95"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            <span>{isEdit ? 'Update' : (isSale ? 'Commit' : 'Record')}</span>
                        </button>
                    </div>
                </div>

                {/* 0. IDENTITY GATE */}
                {!partyId ? (
                    <div className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-10 text-center shadow-lg relative overflow-hidden group max-w-lg mx-auto">
                            <div className="h-16 w-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Building size={32} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-sm font-black text-[var(--deep-contrast)] uppercase tracking-tight mb-2">Party Resolution</h2>
                            <p className="text-[9px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em] mb-4 leading-tight">Identify party to reveal specifications</p>

                            <button
                                type="button"
                                onClick={() => setIsPartyPickerOpen(true)}
                                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[var(--deep-contrast-hover)] transition-all shadow-md active:scale-95 group/btn"
                            >
                                Select Party
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-400">
                            {/* Left: Basic Info */}
                            <div className="lg:col-span-1 space-y-3">
                                <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-3 shadow-md">
                                    <h3 className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 border-b border-[var(--foreground)]/5 pb-1">Metadata</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1 ml-0.5">Account</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsPartyPickerOpen(true)}
                                                className="w-full h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[9px] font-black text-left hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                                            >
                                                <span className="truncate">{filteredParties.find(p => p.id === partyId)?.name || 'SELECT...'}</span>
                                            </button>
                                        </div>
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowTopMore(!showTopMore)}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--foreground)]/3 hover:bg-[var(--foreground)]/8 text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 transition-all border border-[var(--foreground)]/5"
                                            >
                                                {showTopMore ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                {showTopMore ? 'Less' : 'More Details'}
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showTopMore && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden space-y-2 pt-2"
                                                >
                                                    <div>
                                                        <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1 ml-0.5">UID</label>
                                                        <input
                                                            type="text"
                                                            value={invoiceNumber}
                                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                                            className="w-full h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {/* SKU Input Removed */}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <div>
                                                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1 ml-0.5">Date</label>
                                                            <input
                                                                type="date"
                                                                value={date}
                                                                onChange={(e) => setDate(e.target.value)}
                                                                className="w-full h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-2 text-[8px] font-black focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-1 ml-0.5">Due</label>
                                                            <input
                                                                type="date"
                                                                value={dueDate}
                                                                onChange={(e) => setDueDate(e.target.value)}
                                                                className="w-full h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-2 text-[8px] font-black focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-xl space-y-3">
                                    <div className="flex items-center gap-2 border-b border-[var(--foreground)]/5 pb-2 mb-0.5">
                                        <div className="h-5 w-5 rounded-md bg-[var(--primary-green)] text-white flex items-center justify-center">
                                            <Calculator size={12} />
                                        </div>
                                        <h3 className="text-[8px] font-black uppercase tracking-widest text-[var(--deep-contrast)]">Summary</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 px-0.5">
                                            <span>Subtotal</span>
                                            <span className="text-[var(--deep-contrast)] tabular-nums font-mono">{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 px-0.5">
                                            <span>Tax</span>
                                            <span className="text-[var(--deep-contrast)] tabular-nums font-mono">{formatCurrency(totalTax)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-orange-600 px-0.5">
                                                <span>Rebate</span>
                                                <span className="tabular-nums font-mono">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-[var(--primary-green)]/20 mt-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-30">Total</span>
                                            {paymentMode !== 'UNPAID' && (
                                                <span className="text-[6px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary-green)]/10 text-[var(--primary-green)] uppercase">Paid</span>
                                            )}
                                        </div>
                                        <div className={clsx(
                                            "text-2xl font-black tabular-nums tracking-tighter leading-none",
                                            paymentMode !== 'UNPAID' ? "text-[var(--primary-green)]" : "text-[var(--deep-contrast)]"
                                        )}>
                                            {formatCurrency(totalAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Items */}
                            <div className="lg:col-span-4 space-y-3">
                                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden min-h-[400px] shadow-xl">
                                    <div className="px-4 py-3 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Inventory Log</h3>
                                            <p className="text-[7px] font-black text-[var(--foreground)]/40 uppercase tracking-widest">{rows.length} ENTRIES</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] text-[9px] font-black uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 group"
                                        >
                                            <Plus size={12} />
                                            {isSale ? 'ADD PRODUCT' : 'ADD ITEM'}
                                        </button>
                                    </div>

                                    <div className="p-2 space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {rows.length === 0 ? (
                                            <div className="text-center py-24 opacity-10">
                                                <Calculator className="h-8 w-8 mx-auto mb-3" />
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em]">Empty</p>
                                            </div>
                                        ) : (
                                            rows.map((row, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => openEditModal(index)}
                                                    className="group relative p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-[var(--foreground)]/5 hover:bg-[var(--foreground)]/7 transition-all cursor-pointer active:scale-[0.99] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="h-8 w-8 rounded-lg bg-[var(--primary-green)] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                                            <Calculator size={14} strokeWidth={2.5} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase truncate tracking-tight">{row.name}</h4>
                                                            <p className="text-[7px] font-black uppercase tracking-wider text-blue-500 mt-0.5">
                                                                P/U: {formatCurrency(row.rate - (row.purchasePrice || 0))}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className="flex gap-4">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-[var(--deep-contrast)] tabular-nums">{row.quantity} {row.unit} × {formatCurrency(row.rate)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right pl-3 border-l border-[var(--foreground)]/10">
                                                            <p className="text-[12px] font-black text-[var(--primary-green)] tabular-nums font-mono tracking-tighter">{formatCurrency(row.amount)}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setItemToRemoveIndex(index); }}
                                                            className="p-1.5 rounded-lg bg-rose-500/5 text-rose-500 hover:bg-rose-500 transition-all active:scale-95 shadow-sm"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Documentation Layer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">

                            {/* 1. Documentation & Metadata */}
                            <div className="space-y-2">
                                <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-2">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Adjustments</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-white/5 space-y-1">
                                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 font-mono">DIS %</label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    value={discount || ''}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    className="w-full bg-transparent text-[11px] font-black text-[var(--deep-contrast)] focus:outline-none tabular-nums"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-white/5 space-y-1">
                                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30 font-mono">TAX %</label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    value={invoiceTax || ''}
                                                    onChange={(e) => setInvoiceTax(e.target.value)}
                                                    className="w-full bg-transparent text-[11px] font-black text-[var(--deep-contrast)] focus:outline-none tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md flex flex-col min-h-[100px]">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 mb-2">Internal Memo</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="SPECIFICATIONS..."
                                        className="flex-1 w-full bg-transparent text-[10px] font-black text-[var(--deep-contrast)] focus:outline-none resize-none placeholder:opacity-10 custom-scrollbar"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-3">
                                <div className="pt-2 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowBottomMore(!showBottomMore)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/60 transition-all border border-[var(--foreground)]/10 shadow-sm"
                                    >
                                        {showBottomMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {showBottomMore ? 'Less Options' : 'More Options'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showBottomMore && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                                            className="overflow-hidden mt-3"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {/* 2. Authentication & Liquidation */}
                                                <div className="space-y-2">
                                                    <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-2">
                                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Liquidation</label>
                                                        <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsModePickerOpen(true)}
                                                                    className={clsx(
                                                                        "flex-1 h-10 rounded-xl border px-3 text-[9px] font-black flex items-center justify-center transition-all",
                                                                        paymentMode === 'UNPAID' ? "bg-rose-500/5 border-rose-500/10 text-rose-500" : "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/40 text-[var(--primary-green)]"
                                                                    )}
                                                                >
                                                                    {paymentMode}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsAddBankOpen(true)}
                                                                    className="h-10 w-10 rounded-xl border border-dashed border-blue-500/20 bg-blue-500/5 text-blue-500 flex items-center justify-center"
                                                                >
                                                                    <Building size={14} />
                                                                </button>
                                                            </div>

                                                            {paymentMode !== 'UNPAID' && (
                                                                <div className="p-2.5 rounded-xl bg-[var(--foreground)]/3 border border-white/5 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/30">{isSale ? 'Receipt' : 'Disbursement'}</label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newState = !isFullyReceived
                                                                                setIsFullyReceived(newState)
                                                                                if (newState) setReceivedAmount(totalAmount)
                                                                            }}
                                                                            className={clsx(
                                                                                "px-1.5 py-0.5 rounded text-[6px] font-black uppercase transition-all",
                                                                                isFullyReceived ? "bg-[var(--primary-green)] text-white" : "bg-[var(--foreground)]/10 text-[var(--foreground)]/40"
                                                                            )}
                                                                        >
                                                                            Full
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            value={receivedAmount || ''}
                                                                            onChange={(e) => {
                                                                                setReceivedAmount(e.target.value)
                                                                                setIsFullyReceived(false)
                                                                            }}
                                                                            className="flex-1 bg-transparent text-base font-black text-[var(--deep-contrast)] focus:outline-none tabular-nums"
                                                                            placeholder="0.00"
                                                                        />
                                                                        <div className="text-right">
                                                                            <p className={clsx(
                                                                                "text-[10px] font-black tabular-nums font-mono leading-none",
                                                                                balanceDue > 0 ? "text-rose-500" : "text-[var(--primary-green)]"
                                                                            )}>{formatCurrency(balanceDue)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md space-y-3 bg-gradient-to-br from-transparent to-[var(--primary-green)]/[0.02]">
                                                        <div className="flex justify-between items-center">
                                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Auth</label>
                                                            <div className="px-1.5 py-0.5 rounded-full bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[6px] font-black text-[var(--primary-green)] uppercase tracking-widest">
                                                                Signature
                                                            </div>
                                                        </div>
                                                        <div className="relative group">
                                                            <SignaturePad ref={sigPadRef} className="h-56" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 3. Evidence & Media */}
                                                <div className="glass rounded-[20px] border border-[var(--foreground)]/10 p-4 shadow-md flex flex-col">
                                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 mb-3 ml-1">Evidence</label>
                                                    <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto custom-scrollbar max-h-[160px]">
                                                        {attachments.map((url, i) => (
                                                            <div key={i} className="relative group/attachment h-12 w-12 rounded-lg border border-white/5 overflow-hidden shadow-sm">
                                                                <img src={url} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => removeAttachment(i)} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover/attachment:opacity-100 transition-opacity">
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </>
                )}
            </form>

            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={setPartyId}
                title="Select Party"
                options={filteredParties.map(p => ({
                    id: p.id,
                    label: p.name.toUpperCase(),
                    subLabel: p.type // Show type to help debug/identify
                }))}
                selectedValue={partyId}
                footer={
                    <button
                        type="button"
                        onClick={() => {
                            setIsPartyPickerOpen(false)
                            setIsCreatePartyOpen(true)
                        }}
                        className="w-full py-2 rounded-xl bg-[var(--primary-green)]/10 text-[var(--primary-green)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary-green)] hover:text-white transition-all"
                    >
                        + Create New Party
                    </button>
                }
            />

            <CreatePartyModal
                isOpen={isCreatePartyOpen}
                onClose={() => setIsCreatePartyOpen(false)}
                onSuccess={() => {
                    fetchParties() // Immediate manual refresh
                }}
                initialData={{ type: isSale ? 'CUSTOMER' : 'SUPPLIER' }}
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
                onDelete={editingItemIndex !== null ? () => setItemToRemoveIndex(editingItemIndex) : undefined}
                isSale={isSale}
            />

            <ConfirmModal
                isOpen={itemToRemoveIndex !== null}
                onClose={() => setItemToRemoveIndex(null)}
                onConfirm={() => {
                    if (itemToRemoveIndex !== null) {
                        removeRow(itemToRemoveIndex)
                    }
                }}
                title="Remove Line Item?"
                message="Are you sure you want to remove this item from the invoice? You can re-add it later if needed."
                confirmText="Remove"
                variant="danger"
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
