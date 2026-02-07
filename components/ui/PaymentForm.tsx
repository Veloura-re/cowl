'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Loader2, ArrowUpRight, ArrowDownRight, User, Plus, Building, Wallet, CheckCircle2, X, Calculator, Receipt, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import AddSalesItemModal from '@/components/ui/AddSalesItemModal'
import AddPurchaseItemModal from '@/components/ui/AddPurchaseItemModal'
import clsx from 'clsx'

type PaymentFormProps = {
    type?: 'RECEIPT' | 'PAYMENT'
    initialData?: any
    initialBillingEntries?: any[]
    parties?: any[]
    allItems?: any[]
    paymentModes?: any[]
}

export default function PaymentForm({
    type: propType,
    initialData,
    initialBillingEntries,
    parties = [],
    allItems = [],
    paymentModes = []
}: PaymentFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const { activeBusinessId, activeCurrencySymbol, formatCurrency } = useBusiness()

    const isEdit = !!initialData?.id
    const type = initialData?.type || propType || 'RECEIPT'
    const isReceipt = type === 'RECEIPT'

    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isModePickerOpen, setIsModePickerOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null)
    const [isAddBankOpen, setIsAddBankOpen] = useState(false)
    const [newBankName, setNewBankName] = useState('')
    const [addingBank, setAddingBank] = useState(false)
    const [itemToRemoveIndex, setItemToRemoveIndex] = useState<number | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        party_id: initialData?.party_id || '',
        amount: Number(initialData?.amount) || 0,
        mode: initialData?.mode || 'CASH',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        description: initialData?.description || ''
    })
    const [billingEntries, setBillingEntries] = useState<any[]>(initialBillingEntries || [])
    const [givenAmount, setGivenAmount] = useState<number | string>('')
    const [modeBalances, setModeBalances] = useState<Record<string, number>>({})

    // Data State (Client-side fetch if props missing)
    const [fetchedParties, setFetchedParties] = useState<any[]>(parties)
    const [fetchedItems, setFetchedItems] = useState<any[]>(allItems)
    const [fetchedModes, setFetchedModes] = useState<any[]>(paymentModes)

    useEffect(() => {
        async function loadLookupData() {
            if (parties.length === 0) {
                // Load appropriate party types based on transaction type
                // RECEIPT (money IN) -> CUSTOMER & BOTH
                // PAYMENT (money OUT) -> SUPPLIER & BOTH
                const partyTypes = isReceipt ? ['CUSTOMER', 'BOTH'] : ['SUPPLIER', 'BOTH']
                const { data } = await supabase.from('parties').select('*').eq('business_id', activeBusinessId).in('type', partyTypes).order('name')
                if (data) setFetchedParties(data)
            }
            if (allItems.length === 0) {
                const { data } = await supabase.from('items').select('*').eq('business_id', activeBusinessId).order('name')
                if (data) setFetchedItems(data)
            }
            if (paymentModes.length === 0) {
                const { data } = await supabase.from('payment_modes').select('*').eq('business_id', activeBusinessId).order('name')
                if (data) setFetchedModes(data)
            }
        }
        loadLookupData()
    }, [parties.length, allItems.length, paymentModes.length, isReceipt, activeBusinessId])

    const displayParties = parties.length > 0 ? parties : fetchedParties
    const displayItems = allItems.length > 0 ? allItems : fetchedItems
    const displayModes = paymentModes.length > 0 ? paymentModes : fetchedModes

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
            setFormData(prev => ({ ...prev, mode: data.name }))
            setNewBankName('')
            setIsAddBankOpen(false)
        } catch (error: any) {
            alert('Error adding bank: ' + error.message)
        } finally {
            setAddingBank(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanUUID = (id: any) => (id && id !== 'undefined' && id !== '') ? id : null
        if (!activeBusinessId || activeBusinessId === 'undefined') return
        setLoading(true)

        const party_id = cleanUUID(formData.party_id)
        const business_id = cleanUUID(activeBusinessId)

        try {
            if (isEdit) {
                const { error } = await supabase
                    .from('transactions')
                    .update({
                        party_id,
                        amount: Number(formData.amount),
                        mode: formData.mode,
                        date: formData.date,
                        description: formData.description
                    })
                    .eq('id', initialData.id)

                if (error) throw error

                const invoice_id = cleanUUID(initialData.invoice_id)
                if (invoice_id && billingEntries.length > 0) {
                    await supabase.from('invoice_items').delete().eq('invoice_id', invoice_id)

                    const itemsToInsert = billingEntries.map(e => ({
                        invoice_id,
                        item_id: cleanUUID(e.itemId),
                        description: e.name,
                        quantity: e.quantity,
                        rate: e.rate,
                        tax_amount: (e.quantity * e.rate) * (e.tax / 100),
                        total: e.amount
                    }))
                    await supabase.from('invoice_items').insert(itemsToInsert)

                    const totalTax = billingEntries.reduce((sum, e) => sum + ((e.quantity * e.rate) * (e.tax / 100)), 0)
                    const totalAmount = billingEntries.reduce((sum, e) => sum + (e.quantity * e.rate), 0) + totalTax

                    await supabase.from('invoices').update({
                        total_amount: totalAmount,
                        balance_amount: 0
                    }).eq('id', initialData.invoice_id)
                }
            } else {
                const { error } = await supabase.from('transactions').insert({
                    business_id,
                    party_id,
                    amount: Number(formData.amount),
                    type: type,
                    mode: formData.mode,
                    date: formData.date,
                    description: formData.description
                })

                if (error) throw error
            }

            setSuccess(true)
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                router.push('/dashboard/finance')
            }, 1000)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!initialData?.id) return
        setDeleting(true)
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', initialData.id)
            if (error) throw error
            setSuccess(true)
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                router.push('/dashboard/finance')
            }, 1000)
        } catch (err: any) {
            alert('Error deleting: ' + err.message)
        } finally {
            setDeleting(false)
            setIsConfirmOpen(false)
        }
    }

    const handleUpdateEntry = (entryData: any) => {
        let newEntries = [...billingEntries]
        if (editingEntryIndex !== null) {
            newEntries[editingEntryIndex] = entryData
        } else {
            newEntries.push(entryData)
        }
        setBillingEntries(newEntries)
        setIsItemModalOpen(false)
        setEditingEntryIndex(null)

        const newTotal = newEntries.reduce((sum, e) => sum + e.amount, 0)
        setFormData(prev => ({ ...prev, amount: newTotal }))
    }

    const removeEntry = (index: number) => {
        const newEntries = billingEntries.filter((_, i) => i !== index)
        setBillingEntries(newEntries)
        const newTotal = newEntries.reduce((sum, e) => sum + e.amount, 0)
        setFormData(prev => ({ ...prev, amount: newTotal }))
        setItemToRemoveIndex(null)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center pb-20">
                <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-8 text-center shadow-2xl">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-black text-[var(--deep-contrast)] uppercase tracking-tight">Sync {isEdit ? 'Modified' : 'Authenticated'}</h2>
                    <p className="text-[13px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-1">Executing Ledger Update...</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4 pb-20 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/finance" className="p-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xs font-black text-[var(--deep-contrast)] uppercase tracking-tight">
                            {isEdit ? 'Modify' : 'Log'} {isReceipt ? 'Receipt' : 'Payment'}
                        </h1>
                        <p className="text-[13px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">
                            Financial Authenticator
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/5 text-rose-500 text-[14px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Purge</span>
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || formData.amount <= 0}
                        className={clsx(
                            "flex items-center gap-1.5 px-6 py-2 rounded-xl text-[var(--primary-foreground)] text-[14px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50",
                            isReceipt ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                        )}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update Sync' : 'Complete Sync'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side: Basic Info */}
                <div className="space-y-4">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 space-y-4 shadow-lg">
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-3 border-b border-[var(--foreground)]/5 pb-2">Entry Metadata</h3>
                        <div>
                            <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Entity Reference</label>
                            <button
                                type="button"
                                onClick={() => setIsPartyPickerOpen(true)}
                                className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[15px] font-black text-left flex items-center justify-between hover:border-[var(--primary-green)] transition-all shadow-inner"
                            >
                                <span className="truncate">{displayParties.find(p => p.id === formData.party_id)?.name.toUpperCase() || 'GENERAL TRANSACTION...'}</span>
                                <User className="h-5 w-5 lg:h-4 lg:w-4 opacity-20" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Entry Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[14px] font-black focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Valuation ({activeCurrencySymbol})</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.amount === 0 ? '' : formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className={clsx(
                                        "w-full h-11 rounded-xl border px-4 text-[18px] font-black text-center focus:outline-none transition-all shadow-inner tabular-nums",
                                        isReceipt ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 focus:border-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-600 focus:border-rose-500"
                                    )}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Transaction Memorandum</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-24 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-4 text-[15px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all placeholder:text-[var(--foreground)]/10 resize-none shadow-inner"
                                placeholder="Details / Notes..."
                            />
                        </div>
                    </div>

                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between px-1">
                            <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Liquidation Mode</label>
                            <button
                                type="button"
                                onClick={() => setIsAddBankOpen(!isAddBankOpen)}
                                className="text-[7.5px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {isAddBankOpen ? '[ ABORT ]' : '[ ATTACH BANK ]'}
                            </button>
                        </div>

                        {isAddBankOpen && (
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-in slide-in-from-top-2">
                                <label className="block text-[11px] font-black uppercase tracking-widest text-blue-500/60 mb-2 ml-1">Define New Registry</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBankName}
                                        onChange={(e) => setNewBankName(e.target.value)}
                                        placeholder="Name..."
                                        className="flex-1 h-8 rounded-lg bg-[var(--background)]/50 border border-blue-500/20 px-3 text-[14px] font-black uppercase focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddBank}
                                        disabled={addingBank || !newBankName}
                                        className="px-3 h-8 rounded-lg bg-blue-500 text-white text-[12px] font-black uppercase disabled:opacity-50 active:scale-95 shadow-sm"
                                    >
                                        {addingBank ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsModePickerOpen(true)}
                            className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 flex items-center justify-between hover:border-[var(--primary-green)] transition-all shadow-inner"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 opacity-20" />
                                <span className="text-[14px] font-black uppercase tracking-widest text-[var(--deep-contrast)]">{formData.mode}</span>
                            </div>
                            <div className="px-2 py-0.5 rounded-lg bg-[var(--primary-green)]/10 text-[12px] font-black text-[var(--primary-green)] border border-[var(--primary-green)]/10 tabular-nums">
                                {formatCurrency(modeBalances[formData.mode] || 0)}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Side: Cashier Logic & Billing */}
                <div className="space-y-4">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 space-y-4 bg-[var(--foreground)]/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 h-24 w-24 bg-[var(--primary-green)]/5 rounded-full blur-2xl group-hover:bg-[var(--primary-green)]/10 transition-colors" />
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Fiscal Calculator</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2 ml-1">Lump Sum {isReceipt ? 'Tendered' : 'Paid'}</label>
                                <input
                                    type="number"
                                    value={givenAmount}
                                    onChange={(e) => setGivenAmount(e.target.value)}
                                    className="w-full h-11 rounded-xl bg-[var(--background)]/40 border border-[var(--foreground)]/10 px-4 text-[20px] font-black text-center focus:border-[var(--primary-green)] transition-all shadow-inner tabular-nums"
                                    placeholder="0.00"
                                />
                            </div>
                            {Number(givenAmount) > formData.amount && (
                                <div className="p-4 rounded-2xl bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-center animate-in zoom-in-95 shadow-sm">
                                    <p className="text-[12px] font-black text-[var(--primary-green)] uppercase tracking-[0.2em] mb-1">Fiscal Change</p>
                                    <p className="text-2xl font-black text-[var(--primary-green)] tracking-tighter tabular-nums drop-shadow-sm">
                                        {formatCurrency(Number(givenAmount) - formData.amount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(initialData?.invoice_id || billingEntries.length > 0) && (
                        <div className="glass rounded-[24px] border border-[var(--foreground)]/10 p-5 space-y-4 shadow-lg min-h-[300px]">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40">Active Feed</h3>
                                <button
                                    type="button"
                                    onClick={() => { setEditingEntryIndex(null); setIsItemModalOpen(true); }}
                                    className="px-3 py-1.5 rounded-xl bg-[var(--primary-green)] text-[12px] font-black uppercase tracking-widest text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/10 active:scale-95"
                                >
                                    + ADD LINE
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {billingEntries.map((e, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => { setEditingEntryIndex(idx); setIsItemModalOpen(true); }}
                                        className="p-3 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 flex justify-between items-center group shadow-sm hover:bg-[var(--foreground)]/10 transition-all cursor-pointer active:scale-[0.99]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/10">
                                                <Calculator size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-black uppercase text-[var(--deep-contrast)] truncate">{e.name}</p>
                                                <p className="text-[12px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">
                                                    {e.quantity} {e.unit} × {formatCurrency(e.rate)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[15px] font-black text-[var(--primary-green)] tabular-nums">{formatCurrency(e.amount)}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setItemToRemoveIndex(idx); }}
                                                className="p-1.5 rounded-lg text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {billingEntries.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-[var(--foreground)]/20 border-2 border-dashed border-[var(--foreground)]/5 rounded-2xl opacity-40">
                                        <Receipt className="h-8 w-8 mb-2" strokeWidth={1.5} />
                                        <p className="text-[12px] font-black uppercase tracking-[0.3em]">No Recorded Details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={(id) => setFormData({ ...formData, party_id: id })}
                title="Select Account"
                options={[{ id: '', label: 'GENERAL LEDGER (NO PARTY)' }, ...displayParties.map(p => ({ id: p.id, label: p.name.toUpperCase() }))]}
                selectedValue={formData.party_id}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={(mode) => setFormData({ ...formData, mode })}
                title="Select Liquidation Mode"
                options={[
                    { id: 'CASH', label: 'PHYSICAL CASH', subLabel: formatCurrency(modeBalances['CASH'] || 0) },
                    { id: 'BANK', label: 'BANK ACCOUNT', subLabel: formatCurrency(modeBalances['BANK'] || 0) },
                    { id: 'ONLINE', label: 'ONLINE GATEWAY', subLabel: formatCurrency(modeBalances['ONLINE'] || 0) },
                    ...displayModes.map(m => ({
                        id: m.name,
                        label: m.name.toUpperCase(),
                        subLabel: formatCurrency(modeBalances[m.name] || 0)
                    }))
                ]}
                selectedValue={formData.mode}
            />

            <ConfirmModal
                isOpen={itemToRemoveIndex !== null}
                onClose={() => setItemToRemoveIndex(null)}
                onConfirm={() => {
                    if (itemToRemoveIndex !== null) {
                        removeEntry(itemToRemoveIndex)
                    }
                }}
                title="Remove Line Item?"
                message="Are you sure you want to remove this item? You can re-add it later if needed."
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title={`Purge ${isReceipt ? 'Receipt' : 'Payment'}?`}
                message="Irreversibly purge this financial record from the ledger repository? This cannot be undone."
                confirmText="Purge"
                variant="danger"
            />

            {/* Item Modals for Detailed Billing */}
            {isReceipt ? (
                <AddSalesItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    onAdd={handleUpdateEntry}
                    items={displayItems}
                    initialData={editingEntryIndex !== null ? billingEntries[editingEntryIndex] : null}
                    onDelete={editingEntryIndex !== null ? () => setItemToRemoveIndex(editingEntryIndex) : undefined}
                />
            ) : (
                <AddPurchaseItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    onAdd={handleUpdateEntry}
                    items={displayItems}
                    initialData={editingEntryIndex !== null ? billingEntries[editingEntryIndex] : null}
                    onDelete={editingEntryIndex !== null ? () => setItemToRemoveIndex(editingEntryIndex) : undefined}
                />
            )}
        </form>
    )
}
