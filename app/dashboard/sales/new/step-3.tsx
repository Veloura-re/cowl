'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Save, Loader2, Edit3 } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import SignaturePad from '@/components/ui/signature-pad'

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
                {/* Summary Table & Financial Resolution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Invoice Metadata Summary */}
                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-6 space-y-4">
                        <div className="flex items-center gap-3 border-b border-[var(--foreground)]/5 pb-3">
                            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Edit3 size={14} />
                            </div>
                            <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-widest">Document Header</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Customer / Client</p>
                                <p className="text-[12px] font-black text-[var(--deep-contrast)] truncate">{data.partyName}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Reference ID</p>
                                <p className="text-[12px] font-black text-[var(--deep-contrast)]">{data.invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Issue Date</p>
                                <p className="text-[12px] font-black text-[var(--deep-contrast)]">{new Date(data.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Line Density</p>
                                <p className="text-[12px] font-black text-[var(--deep-contrast)]">{data.items.length} RECORDED</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Totals */}
                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-6 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/30">
                                <span>NET SUB-TOTAL</span>
                                <span className="text-[var(--deep-contrast)] tabular-nums">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/30">
                                <span>AGGREGATED TAX</span>
                                <span className="text-[var(--deep-contrast)] tabular-nums">{formatCurrency(totalTax)}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--foreground)]/10 flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--foreground)]/30 mb-1">Grand Valuation</p>
                                <p className="text-[24px] font-black text-[var(--primary-green)] tabular-nums leading-none tracking-tighter">
                                    {formatCurrency(grandTotal)}
                                </p>
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-[var(--primary-green)]/10 text-[var(--primary-green)] text-[8px] font-black uppercase tracking-widest border border-[var(--primary-green)]/20">
                                PENDING SAVE
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Manifest */}
                <div className="glass rounded-[32px] border border-[var(--foreground)]/10 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5">
                        <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-widest">Items Manifest</h3>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--foreground)]/5">
                                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30">Specification</th>
                                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 text-center">Volume</th>
                                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 text-center">Rate</th>
                                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 text-right">Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--foreground)]/5">
                                {data.items.map((item, index) => (
                                    <tr key={index} className="group hover:bg-[var(--foreground)]/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <p className="text-[12px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">{item.name}</p>
                                            {item.tax > 0 && <span className="text-[8px] font-black text-[var(--foreground)]/30 uppercase">TAX: {item.tax}%</span>}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-1 rounded-lg bg-[var(--foreground)]/5 text-[10px] font-black text-[var(--deep-contrast)] uppercase">{item.quantity} {item.unit}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-[11px] font-black text-[var(--foreground)]/50 tabular-nums uppercase">
                                            {formatCurrency(item.rate)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-[12px] font-black text-[var(--primary-green)] tabular-nums font-mono">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section: Notes & Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-6 flex flex-col">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-4 ml-1">Internal Provisions</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => updateData({ notes: e.target.value })}
                            className="flex-1 w-full bg-transparent text-[11px] font-black text-[var(--deep-contrast)] focus:outline-none resize-none placeholder:opacity-10 min-h-[120px]"
                            placeholder="APPEND MEMORANDUM..."
                        />
                    </div>

                    <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-6 space-y-4 shadow-2xl bg-gradient-to-br from-transparent to-[var(--primary-green)]/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/30 ml-1">Client Authentication</label>
                            <div className="px-2 py-0.5 rounded-full bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[7px] font-black text-[var(--primary-green)] uppercase tracking-widest">
                                Required for validation
                            </div>
                        </div>
                        <div className="relative group">
                            <SignaturePad className="h-64" />
                        </div>
                        <p className="text-[7px] font-bold text-[var(--foreground)]/30 text-center uppercase tracking-widest leading-relaxed px-4">
                            By signing above, the client acknowledges and accepts the terms of this transaction as documented in the items manifest.
                        </p>
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
