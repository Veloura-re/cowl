'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Loader2, ArrowUpRight, ArrowDownRight, User, Plus, Building, Wallet, CheckCircle2, X } from 'lucide-react'
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
    parties: any[]
    allItems: any[]
    paymentModes: any[]
}

export default function PaymentForm({
    type: propType,
    initialData,
    initialBillingEntries,
    parties,
    allItems,
    paymentModes
}: PaymentFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const { activeBusinessId, activeCurrencySymbol, formatCurrency } = useBusiness()

    const isEdit = !!initialData
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
        if (!activeBusinessId) return
        setLoading(true)

        try {
            if (isEdit) {
                // Update Transaction
                const { error } = await supabase
                    .from('transactions')
                    .update({
                        party_id: formData.party_id || null,
                        amount: Number(formData.amount),
                        mode: formData.mode,
                        date: formData.date,
                        description: formData.description
                    })
                    .eq('id', initialData.id)

                if (error) throw error

                // Update Invoice Items if linked
                if (initialData.invoice_id && billingEntries.length > 0) {
                    // Logic from PaymentModal: delete and re-insert
                    await supabase.from('invoice_items').delete().eq('invoice_id', initialData.invoice_id)

                    const itemsToInsert = billingEntries.map(e => ({
                        invoice_id: initialData.invoice_id,
                        item_id: e.itemId || null,
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
                        balance_amount: 0 // Assume full pay if editing bill items here? Actually logic copied from modal.
                    }).eq('id', initialData.invoice_id)
                }
            } else {
                // Insert Transaction
                const { error } = await supabase.from('transactions').insert({
                    business_id: activeBusinessId,
                    party_id: formData.party_id || null,
                    amount: Number(formData.amount),
                    type: type,
                    mode: formData.mode,
                    date: formData.date,
                    description: formData.description
                })

                if (error) throw error
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard/finance')
                router.refresh()
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
            setTimeout(() => {
                router.push('/dashboard/finance')
                router.refresh()
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
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center pb-20">
                <div className="glass rounded-2xl border border-white/40 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-[var(--primary-green)] mx-auto mb-3 animate-in zoom-in" />
                    <h2 className="text-lg font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Transaction {isEdit ? 'Updated' : 'Logged'}!</h2>
                    <p className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase mt-1">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4 pb-20 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/finance" className="p-1.5 rounded-xl bg-white/50 border border-white/10 hover:bg-[var(--primary-green)] hover:text-white transition-all">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">
                            {isEdit ? 'Update' : 'New'} {isReceipt ? 'Deposit' : 'Expense'}
                        </h1>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-widest leading-none">
                            {isReceipt ? 'Credit entry to ledger' : 'Debit entry from ledger'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || formData.amount <= 0}
                        className={clsx(
                            "flex items-center gap-1.5 px-6 py-2 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50",
                            isReceipt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
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
                    <div className="glass rounded-2xl border border-white/40 p-5 space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Entity / Party Reference</label>
                            <button
                                type="button"
                                onClick={() => setIsPartyPickerOpen(true)}
                                className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-[12px] font-bold text-left flex items-center justify-between hover:border-[var(--primary-green)] transition-all shadow-inner"
                            >
                                <span>{parties.find(p => p.id === formData.party_id)?.name || 'General Transaction (No Party)'}</span>
                                <User className="h-4 w-4 opacity-20" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-[11px] font-bold focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Fiscal Amount ({activeCurrencySymbol})</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="w-full h-11 rounded-xl bg-[var(--primary-green)]/5 border border-[var(--primary-green)]/20 px-4 text-lg font-bold text-center text-[var(--primary-green)] focus:outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-2 ml-1">Notation / Memo</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-24 rounded-xl bg-white/50 border border-white/20 p-4 text-[11px] font-bold focus:border-[var(--primary-green)] focus:outline-none transition-all placeholder:text-black/10"
                                placeholder="Enter transaction details..."
                            />
                        </div>
                    </div>

                    <div className="glass rounded-2xl border border-white/40 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 ml-1">Payment Mode</label>
                            <button
                                type="button"
                                onClick={() => setIsAddBankOpen(!isAddBankOpen)}
                                className="text-[9px] font-bold uppercase text-blue-500 hover:underline"
                            >
                                {isAddBankOpen ? 'Cancel' : '+ New Bank'}
                            </button>
                        </div>

                        {isAddBankOpen && (
                            <div className="flex gap-2 animate-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={newBankName}
                                    onChange={(e) => setNewBankName(e.target.value)}
                                    placeholder="Bank Name..."
                                    className="flex-1 h-9 rounded-xl bg-white border border-blue-200 px-3 text-[10px] font-bold uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddBank}
                                    disabled={addingBank || !newBankName}
                                    className="px-4 h-9 rounded-xl bg-blue-500 text-white text-[9px] font-bold uppercase disabled:opacity-50"
                                >
                                    {addingBank ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsModePickerOpen(true)}
                            className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 flex items-center justify-between hover:border-[var(--primary-green)] transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 opacity-20" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">{formData.mode}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--primary-green)]">{formatCurrency(modeBalances[formData.mode] || 0)}</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Cashier Logic & Billing */}
                <div className="space-y-4">
                    <div className="glass rounded-2xl border border-white/40 p-5 space-y-4 bg-white/20">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 ml-1">Cashier Calculator</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1 ml-1">Cash Given / Received</label>
                                <input
                                    type="number"
                                    value={givenAmount}
                                    onChange={(e) => setGivenAmount(e.target.value)}
                                    className="w-full h-11 rounded-xl bg-white/60 border border-white/30 px-4 text-lg font-bold text-center focus:outline-none transition-all shadow-inner"
                                    placeholder="0.00"
                                />
                            </div>
                            {Number(givenAmount) > formData.amount && (
                                <div className="p-4 rounded-2xl bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-center animate-in zoom-in-95">
                                    <p className="text-[9px] font-bold text-[var(--primary-green)] uppercase tracking-[0.2em] mb-1">Return Balance</p>
                                    <p className="text-2xl font-black text-[var(--primary-green)] tracking-tight">
                                        {formatCurrency(Number(givenAmount) - formData.amount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(initialData?.invoice_id || billingEntries.length > 0) && (
                        <div className="glass rounded-2xl border border-white/40 p-5 space-y-3">
                            <div className="flex items-center justify-between ml-1">
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">Billing Entries</h3>
                                <button
                                    type="button"
                                    onClick={() => { setEditingEntryIndex(null); setIsItemModalOpen(true); }}
                                    className="p-1 px-2 rounded-lg bg-[var(--primary-green)]/10 text-[9px] font-bold uppercase text-[var(--primary-green)] hover:bg-[var(--primary-green)]/20 transition-all"
                                >
                                    + Add Item
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {billingEntries.map((e, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-2xl bg-white/50 border border-white/30 flex justify-between items-center group shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-[var(--deep-contrast)]">{e.name}</p>
                                                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">
                                                    {e.quantity} Units × {formatCurrency(e.rate)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-[var(--primary-green)]">{formatCurrency(e.amount)}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingEntryIndex(idx); setIsItemModalOpen(true); }}
                                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEntry(idx)}
                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {billingEntries.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-[var(--foreground)]/20 border-2 border-dashed border-black/5 rounded-2xl">
                                        <Plus className="h-6 w-6 mb-1 opacity-10" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest">No detailed items</p>
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
                title="Select Party"
                options={[{ id: '', label: 'General Transaction (No Party)' }, ...parties.map(p => ({ id: p.id, label: p.name }))]}
                selectedValue={formData.party_id}
            />

            <PickerModal
                isOpen={isModePickerOpen}
                onClose={() => setIsModePickerOpen(false)}
                onSelect={(mode) => setFormData({ ...formData, mode })}
                title="Select Payment Mode"
                options={[
                    { id: 'CASH', label: 'CASH', subLabel: formatCurrency(modeBalances['CASH'] || 0) },
                    { id: 'BANK', label: 'BANK', subLabel: formatCurrency(modeBalances['BANK'] || 0) },
                    { id: 'ONLINE', label: 'ONLINE', subLabel: formatCurrency(modeBalances['ONLINE'] || 0) },
                    ...paymentModes.map(m => ({
                        id: m.name,
                        label: m.name,
                        subLabel: formatCurrency(modeBalances[m.name] || 0)
                    }))
                ]}
                selectedValue={formData.mode}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title={`Delete ${isReceipt ? 'Receipt' : 'Payment'}?`}
                message="Are you sure you want to permanently delete this transaction? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            {/* Item Modals for Detailed Billing */}
            {isReceipt ? (
                <AddSalesItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    onAdd={handleUpdateEntry}
                    items={allItems}
                    initialData={editingEntryIndex !== null ? billingEntries[editingEntryIndex] : null}
                />
            ) : (
                <AddPurchaseItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    onAdd={handleUpdateEntry}
                    items={allItems}
                    initialData={editingEntryIndex !== null ? billingEntries[editingEntryIndex] : null}
                />
            )}
        </form>
    )
}
