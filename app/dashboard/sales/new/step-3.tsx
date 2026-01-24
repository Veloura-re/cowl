'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Save, Loader2, Edit3 } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Step3Props = {
    onNext: () => void
    onBack: () => void
}

export default function Step3Review({ onNext, onBack }: Step3Props) {
    const { data, updateData, updateItem } = useInvoice()
    const { activeBusinessId, formatCurrency } = useBusiness()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
    const totalTax = data.items.reduce((sum, item) => sum + ((item.amount * item.tax) / 100), 0)
    const grandTotal = subtotal + totalTax

    const handleSave = async () => {
        if (!activeBusinessId) {
            setError('No active business found')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Create Invoice
            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    business_id: activeBusinessId,
                    party_id: data.partyId,
                    invoice_number: data.invoiceNumber,
                    date: data.date,
                    total_amount: grandTotal,
                    balance_amount: grandTotal,
                    type: 'SALE',
                    status: 'UNPAID',
                    notes: data.notes
                })
                .select()
                .single()

            if (invoiceError) throw invoiceError

            // Create Invoice Items
            const invoiceItems = data.items.map(item => ({
                invoice_id: invoice.id,
                item_id: item.itemId,
                description: item.name,
                quantity: item.quantity,
                rate: item.rate,
                tax_amount: (item.amount * item.tax) / 100,
                total: item.amount
            }))

            const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
            if (itemsError) throw itemsError

            // Update Stock
            for (const item of data.items) {
                if (item.itemId) {
                    const { data: stockItem } = await supabase
                        .from('items')
                        .select('stock_quantity')
                        .eq('id', item.itemId)
                        .single()

                    if (stockItem) {
                        const newStock = (stockItem.stock_quantity || 0) - item.quantity
                        await supabase
                            .from('items')
                            .update({ stock_quantity: newStock })
                            .eq('id', item.itemId)
                    }
                }
            }

            onNext()
        } catch (err: any) {
            setError(err.message || 'Failed to save invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 dark:border-white/5 bg-[var(--primary-green)]/5">
                <h2 className="text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Review & Confirm</h2>
                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-0.5">Verify all details before saving</p>
            </div>

            <div className="p-5 space-y-4">
                {/* Invoice Summary Card */}
                <div className="glass rounded-2xl border border-white/30 dark:border-white/10 p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Customer</div>
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{data.partyName}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Invoice #</div>
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{data.invoiceNumber}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Date</div>
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{new Date(data.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1">Items</div>
                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{data.items.length}</div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="glass rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/40 dark:bg-white/5 border-b border-white/20 dark:border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">Item</th>
                                    <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 text-center">Qty × Unit</th>
                                    <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 text-center">Rate/Unit</th>
                                    <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 dark:divide-white/5">
                                {data.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-bold text-[var(--deep-contrast)]">{item.name}</div>
                                            {item.tax > 0 && (
                                                <div className="text-[9px] font-bold text-[var(--foreground)]/40">Tax: {item.tax}%</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold text-[var(--deep-contrast)]">{item.quantity} × {item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold text-[var(--deep-contrast)]">{formatCurrency(item.rate)}/{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-bold text-[var(--primary-green)]">{formatCurrency(item.amount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-2">
                        Internal Notes (Optional)
                    </label>
                    <textarea
                        value={data.notes}
                        onChange={(e) => updateData({ notes: e.target.value })}
                        className="w-full min-h-[80px] rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 p-3 text-sm font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none resize-none placeholder-[var(--foreground)]/20"
                        placeholder="Add payment terms, delivery notes, or other information..."
                    />
                </div>

                {/* Totals */}
                <div className="glass rounded-2xl border border-white/30 dark:border-white/10 p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="font-bold text-[var(--foreground)]/50 uppercase tracking-wider">Subtotal</span>
                        <span className="font-bold text-[var(--deep-contrast)]">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-bold text-[var(--foreground)]/50 uppercase tracking-wider">Total Tax</span>
                        <span className="font-bold text-[var(--deep-contrast)]">{formatCurrency(totalTax)}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-3 border-t border-white/20 dark:border-white/10">
                        <span className="font-bold text-[var(--deep-contrast)] uppercase tracking-wider">Grand Total</span>
                        <span className="font-bold text-[var(--primary-green)]">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-sm font-bold text-red-500">{error}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-white/10 dark:border-white/5 flex justify-between">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 text-[var(--deep-contrast)] font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary-green)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Invoice
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
