'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal, { Option } from '@/components/ui/PickerModal'
import ErrorModal from '@/components/ui/ErrorModal'
import { printInvoice, InvoiceData } from '@/utils/invoice-generator'
import { currencies } from '@/lib/currencies'

type InvoiceFormProps = {
    parties: any[]
    items: any[]
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

export default function InvoiceForm({ parties, items }: InvoiceFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [isItemPickerOpen, setIsItemPickerOpen] = useState(false)
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    // Form State
    const [partyId, setPartyId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [invoiceNumber, setInvoiceNumber] = useState('INV-' + Math.floor(Math.random() * 10000))
    const [rows, setRows] = useState<InvoiceItem[]>([
        { itemId: '', name: '', unit: '', quantity: 1, rate: 0, tax: 0, amount: 0 }
    ])
    const [notes, setNotes] = useState('')

    // Calculations
    const { subtotal, totalTax, totalAmount } = React.useMemo(() => {
        const sub = rows.reduce((sum, row) => sum + (row.quantity * row.rate), 0)
        const tax = rows.reduce((sum, row) => sum + ((row.quantity * row.rate) * (row.tax / 100)), 0)
        return {
            subtotal: sub,
            totalTax: tax,
            totalAmount: sub + tax
        }
    }, [rows])

    const handleItemChange = React.useCallback((index: number, itemId: string) => {
        const item = items.find(i => i.id === itemId)
        setRows(prevRows => {
            const newRows = [...prevRows]
            newRows[index] = {
                ...newRows[index],
                itemId,
                name: item?.name || '',
                unit: item?.unit || '',
                rate: item?.selling_price || 0,
                tax: item?.tax_rate || 0,
                amount: (newRows[index].quantity * (item?.selling_price || 0))
            }
            return newRows
        })
    }, [items])

    const updateRow = React.useCallback((index: number, field: keyof InvoiceItem, value: any) => {
        setRows(prevRows => {
            const newRows = [...prevRows]
            newRows[index] = { ...newRows[index], [field]: value }
            if (field === 'quantity' || field === 'rate') {
                newRows[index].amount = newRows[index].quantity * newRows[index].rate
            }
            return newRows
        })
    }, [])

    const addRow = () => {
        setRows([...rows, { itemId: '', name: '', unit: '', quantity: 1, rate: 0, tax: 0, amount: 0 }])
    }

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index))
        }
    }

    const { activeBusinessId, formatCurrency, setIsGlobalLoading, showSuccess, showError, businesses } = useBusiness()

    const handleSubmit = async (e: React.FormEvent, shouldPrint = false) => {
        if (e) e.preventDefault()
        if (!activeBusinessId) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
            // 1. Create Invoice
            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    business_id: activeBusinessId,
                    party_id: partyId,
                    invoice_number: invoiceNumber,
                    date: date,
                    total_amount: totalAmount,
                    balance_amount: totalAmount,
                    type: 'SALE',
                    status: 'UNPAID',
                    notes: notes
                })
                .select()
                .single()

            if (invoiceError) throw invoiceError

            const invoiceItems = rows.map(row => ({
                invoice_id: invoice.id,
                item_id: row.itemId || null,
                description: row.name,
                quantity: row.quantity,
                rate: row.rate,
                tax_amount: (row.quantity * row.rate) * (row.tax / 100),
                total: row.amount
            }))

            const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
            if (itemsError) throw itemsError

            // SUCCESS: Update Stock
            for (const row of rows) {
                if (row.itemId) {
                    const { data: item } = await supabase.from('items').select('stock_quantity').eq('id', row.itemId).single()
                    if (item) {
                        const newStock = (item.stock_quantity || 0) - row.quantity
                        await supabase.from('items').update({ stock_quantity: newStock }).eq('id', row.itemId)
                    }
                }
            }

            if (shouldPrint) {
                const activeBusiness = businesses.find(b => b.id === activeBusinessId)
                const currencyCode = (activeBusiness as any)?.currency || 'USD'
                const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol || '$'
                const selectedParty = parties.find(p => p.id === partyId)

                const invoiceData: InvoiceData = {
                    invoiceNumber: invoice.invoice_number,
                    date: invoice.date,
                    type: 'SALE',
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
                    totalAmount: totalAmount,
                    status: 'UNPAID',
                    balanceAmount: totalAmount,
                    notes: notes,
                    currency: currencyCode,
                    currencySymbol: currencySymbol
                }
                printInvoice(invoiceData)
            }

            setIsGlobalLoading(false)
            showSuccess(`Invoice ${invoiceNumber} saved successfully.`)
            router.push('/dashboard/sales')
            router.refresh()
        } catch (err: any) {
            setIsGlobalLoading(false)
            showError(err.message, 'Sales Failure')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto pb-20 px-4 sm:px-0 animate-in fade-in duration-500">
            {/* Header - Ultra Compact */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/sales" className="p-1.5 rounded-lg bg-white/50 border border-white/10 hover:bg-[var(--primary-green)] hover:text-white transition-all shadow-sm">
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-tight">New Sale</h1>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">Invoice Creation</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-xl bg-white/50 border border-white/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--deep-contrast)] hover:bg-white transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        <Printer className="mr-1.5 h-3 w-3" />
                        Save & Print
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={loading}
                        className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[var(--primary-green)] transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                        <Save className="mr-1.5 h-3 w-3" />
                        Save Invoice
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Secondary Info - Compact Column */}
                <div className="md:col-span-1 space-y-3">
                    <div className="glass rounded-[24px] border border-white/40 overflow-hidden">
                        <div className="px-4 py-2 border-b border-white/10 bg-white/40">
                            <h3 className="text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider">Metadata</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1 ml-1">Customer</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPartyPickerOpen(true)}
                                    className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all shadow-inner text-left flex items-center justify-between"
                                >
                                    <span className="truncate">{parties.find(p => p.id === partyId)?.name || 'Select Party'}</span>
                                    <Plus className="h-3 w-3 opacity-20" />
                                </button>
                                <PickerModal
                                    isOpen={isPartyPickerOpen}
                                    onClose={() => setIsPartyPickerOpen(false)}
                                    onSelect={(id) => setPartyId(id)}
                                    title="Select Customer"
                                    options={parties.map(p => ({ id: p.id, label: p.name, subLabel: p.phone }))}
                                    selectedValue={partyId}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1 ml-1">Invoice ID</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1 ml-1">Entry Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-8 rounded-xl bg-white/50 border border-white/20 px-3 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-1 ml-1">Internal Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full min-h-[60px] rounded-xl bg-white/50 border border-white/20 p-2.5 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner resize-none placeholder-[var(--foreground)]/10"
                                    placeholder="Add payment terms or notes..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-[24px] border border-white/40 p-4 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 px-1">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 px-1">
                            <span>Taxation</span>
                            <span>{formatCurrency(totalTax)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-[var(--deep-contrast)] pt-2 border-t border-[var(--primary-green)]/5 mt-1 px-1">
                            <span className="text-[10px] uppercase tracking-wider pt-1">Total</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Items Grid - Dense Row Management */}
                <div className="md:col-span-3">
                    <div className="glass rounded-[24px] border border-white/40 overflow-hidden">
                        <div className="px-5 py-2.5 border-b border-white/10 bg-[var(--primary-green)]/5 flex justify-between items-center">
                            <h3 className="text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider">Line Items</h3>
                            <button onClick={addRow} className="flex items-center text-[9px] font-bold uppercase tracking-wider text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-all bg-white/40 px-3 py-1 rounded-full border border-white/50">
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            {rows.map((row, index) => (
                                <div key={index} className="group relative glass p-3 rounded-2xl border border-white/30 hover:bg-white/60 transition-all flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => removeRow(index)}
                                        className="absolute -top-1.5 -right-1.5 p-1 bg-white rounded-full border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm z-10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>

                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1">Stock Item</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveRowIndex(index)
                                                setIsItemPickerOpen(true)
                                            }}
                                            className="w-full h-8 rounded-xl bg-white/40 border border-white/10 px-3 text-[10px] font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all text-left flex items-center justify-between"
                                        >
                                            <span className="truncate">{row.name || 'Select Resource'}</span>
                                            <Plus className="h-3 w-3 opacity-20" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 sm:w-[320px]">
                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1 text-center">Qty {row.unit && `(${row.unit})`}</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={row.quantity}
                                                onChange={(e) => updateRow(index, 'quantity', Number(e.target.value))}
                                                className="w-full h-8 rounded-xl bg-white/40 border border-white/10 px-2 text-[10px] font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1 text-center">Rate</label>
                                            <input
                                                type="number"
                                                value={row.rate}
                                                onChange={(e) => updateRow(index, 'rate', Number(e.target.value))}
                                                className="w-full h-8 rounded-xl bg-white/40 border border-white/10 px-2 text-[10px] font-bold text-[var(--deep-contrast)] text-center focus:border-[var(--primary-green)] focus:outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1 text-center">Tax %</label>
                                            <div className="h-8 flex items-center justify-center text-[10px] font-bold text-[var(--foreground)]/40">
                                                {row.tax}%
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30 mb-1 text-right">Sum</label>
                                            <div className="h-8 flex items-center justify-end px-1 text-[10px] font-bold text-[var(--primary-green)]">
                                                {formatCurrency(row.amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {rows.length === 0 && (
                            <div className="p-10 text-center opacity-30">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No line items added</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PickerModal
                isOpen={isItemPickerOpen}
                onClose={() => {
                    setIsItemPickerOpen(false)
                    setActiveRowIndex(null)
                }}
                onSelect={(id) => {
                    if (activeRowIndex !== null) {
                        handleItemChange(activeRowIndex, id)
                    }
                }}
                title="Select Resource"
                options={items.map(i => ({ id: i.id, label: i.name, subLabel: `${i.stock_quantity ?? 0} ${i.unit ?? 'Units'} in stock` }))}
                selectedValue={activeRowIndex !== null ? rows[activeRowIndex].itemId : null}
            />

            <ErrorModal
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ ...errorModal, open: false })}
                message={errorModal.message}
            />
        </div>
    )
}
