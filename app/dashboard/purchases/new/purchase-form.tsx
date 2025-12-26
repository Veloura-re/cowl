'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type PurchaseFormProps = {
    parties: any[]
    items: any[]
}

type InvoiceItem = {
    itemId: string
    name: string
    quantity: number
    rate: number
    tax: number
    amount: number
}

export default function PurchaseForm({ parties, items }: PurchaseFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    // Form State
    const [partyId, setPartyId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [rows, setRows] = useState<InvoiceItem[]>([
        { itemId: '', name: '', quantity: 1, rate: 0, tax: 0, amount: 0 }
    ])

    // Calculations
    const subtotal = rows.reduce((sum, row) => sum + (row.quantity * row.rate), 0)
    const totalTax = rows.reduce((sum, row) => sum + ((row.quantity * row.rate) * (row.tax / 100)), 0)
    const totalAmount = subtotal + totalTax

    const handleItemChange = (index: number, itemId: string) => {
        const item = items.find(i => i.id === itemId)
        const newRows = [...rows]
        newRows[index] = {
            ...newRows[index],
            itemId,
            name: item?.name || '',
            rate: item?.purchase_price || 0, // PURCHASE PRICE
            tax: item?.tax_rate || 0,
            amount: (newRows[index].quantity * (item?.purchase_price || 0))
        }
        setRows(newRows)
    }

    const updateRow = (index: number, field: keyof InvoiceItem, value: any) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [field]: value }
        if (field === 'quantity' || field === 'rate') {
            newRows[index].amount = newRows[index].quantity * newRows[index].rate
        }
        setRows(newRows)
    }

    const addRow = () => {
        setRows([...rows, { itemId: '', name: '', quantity: 1, rate: 0, tax: 0, amount: 0 }])
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!partyId) return alert('Select a supplier')
        if (!invoiceNumber) return alert('Enter bill number')
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1)
            const businessId = businesses?.[0]?.id

            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert({
                    business_id: businessId,
                    party_id: partyId,
                    invoice_number: invoiceNumber,
                    date: date,
                    total_amount: totalAmount,
                    balance_amount: totalAmount,
                    type: 'PURCHASE', // TYPE
                    status: 'UNPAID'
                })
                .select()
                .single()

            if (invError) throw invError

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

            // TODO: Update Stock (Increment)

            router.push('/dashboard/purchases')
            router.refresh()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/purchases" className="p-2 rounded-lg hover:bg-[var(--surface-highlight)] text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">Enter Purchase Bill</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
                >
                    <Save className="mr-2 h-4 w-4" />
                    Save Bill
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Supplier</label>
                            <select
                                value={partyId}
                                onChange={(e) => setPartyId(e.target.value)}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            >
                                <option value="">Select Supplier</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Bill Number</label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                                placeholder="e.g. BILL-999"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg bg-[var(--background)] border border-[var(--surface-highlight)] px-3 py-2 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--surface-highlight)]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Item</th>
                                    <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] w-20">Qty</th>
                                    <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] w-24">Rate</th>
                                    <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-right">Amount</th>
                                    <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--surface-highlight)]">
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="p-2">
                                            <select
                                                value={row.itemId}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                className="w-full rounded bg-[var(--background)] border border-[var(--surface-highlight)] px-2 py-1 text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                                            >
                                                <option value="">Select Item</option>
                                                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={row.quantity}
                                                onChange={(e) => updateRow(index, 'quantity', Number(e.target.value))}
                                                className="w-full rounded bg-[var(--background)] border border-[var(--surface-highlight)] px-2 py-1 text-[var(--text-main)] text-right focus:border-[var(--primary)] focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={row.rate}
                                                onChange={(e) => updateRow(index, 'rate', Number(e.target.value))}
                                                className="w-full rounded bg-[var(--background)] border border-[var(--surface-highlight)] px-2 py-1 text-[var(--text-main)] text-right focus:border-[var(--primary)] focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-medium text-[var(--text-main)]">
                                            {row.amount.toFixed(2)}
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeRow(index)} className="text-[var(--text-muted)] hover:text-[var(--color-status-error)]">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-2 border-t border-[var(--surface-highlight)]">
                            <button onClick={addRow} className="flex items-center text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] px-2">
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <div className="w-64 space-y-2 text-right">
                            <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>Tax</span>
                                <span>{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-[var(--text-main)] border-t border-[var(--surface-highlight)] pt-2">
                                <span>Total (Payable)</span>
                                <span>{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
