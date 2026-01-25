'use client'

import { X, Printer, Download, Share2 } from 'lucide-react'
import { InvoiceData } from '@/utils/invoice-generator'
import { format } from 'date-fns'
import clsx from 'clsx'

type InvoicePreviewModalProps = {
    isOpen: boolean
    onClose: () => void
    data: InvoiceData
    onPrint: () => void
    onDownload: () => void
}

export default function InvoicePreviewModal({
    isOpen,
    onClose,
    data,
    onPrint,
    onDownload
}: InvoicePreviewModalProps) {
    if (!isOpen) return null

    const isSale = data.type === 'SALE'

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="glass w-full max-w-3xl h-[95vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]/95">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 px-6 py-4 bg-[var(--foreground)]/5 sticky top-0 z-20">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">Invoice Preview</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">A4 Standard Format</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                            title="Print"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Print</span>
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--deep-contrast)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                            title="Download PDF"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--foreground)]/5 transition-all text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/50 custom-scrollbar">
                    <div className="w-full max-w-[126mm] mx-auto bg-white shadow-2xl overflow-hidden border border-black/5 flex flex-col min-h-[178mm]">
                        {/* Internal Invoice Styling */}
                        <div className="p-8 md:p-10 space-y-6 flex-1">
                            {/* Brand Header */}
                            <div className="flex justify-between items-start border-b border-[var(--primary-green)] pb-1.5">
                                <div>
                                    <h1 className="text-[12px] font-black text-[var(--primary-green)] tracking-tighter leading-none">
                                        {isSale ? 'SALES INVOICE' : 'PURCHASE BILL'}
                                    </h1>
                                    <p className="text-[6px] font-bold text-black/60 mt-0.5 uppercase tracking-widest leading-none">{data.businessName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[5px] font-black text-black/40 uppercase tracking-widest leading-none">No.</p>
                                    <p className="text-[9px] font-black text-black leading-none mt-0.5">{data.invoiceNumber}</p>
                                </div>
                            </div>

                            {/* Parties Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-0.5">
                                    <h3 className="text-[5px] font-black text-black/40 uppercase tracking-widest border-b border-black/5 pb-0.5">FROM</h3>
                                    <div className="space-y-0.5 pt-0.5">
                                        <p className="text-[8px] font-black text-black uppercase leading-tight">{data.businessName}</p>
                                        <p className="text-[6px] text-black/60 leading-tight max-w-[120px] font-medium">{data.businessAddress}</p>
                                        <p className="text-[6px] font-bold text-black/80">{data.businessPhone}</p>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-[5px] font-black text-black/40 uppercase tracking-widest border-b border-black/5 pb-0.5">
                                        {isSale ? 'BILL TO' : 'SUPPLIER'}
                                    </h3>
                                    <div className="space-y-0.5 pt-0.5">
                                        <p className="text-[8px] font-black text-black uppercase leading-tight">{data.partyName}</p>
                                        <p className="text-[6px] text-black/60 leading-tight max-w-[120px] font-medium">{data.partyAddress}</p>
                                        <p className="text-[6px] font-bold text-black/80">{data.partyPhone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates & Status */}
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-black/5">
                                <div>
                                    <p className="text-[5px] font-black text-black/40 uppercase tracking-widest text-center">ISSUE DATE</p>
                                    <p className="text-[8px] font-bold text-center leading-none mt-0.5">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[5px] font-black text-black/40 uppercase tracking-widest text-center">DUE DATE</p>
                                    <p className="text-[8px] font-bold text-center leading-none mt-0.5">{data.dueDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[5px] font-black text-black/40 uppercase tracking-widest text-center">STATUS</p>
                                    <div className="flex justify-center mt-0.5">
                                        <span className={clsx(
                                            "text-[6px] font-black uppercase tracking-tighter px-1 py-0.5 rounded border leading-none",
                                            data.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                data.status === 'PARTIAL' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    "bg-rose-50 text-rose-600 border-rose-200"
                                        )}>
                                            {data.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[var(--primary-green)] text-white">
                                        <th className="p-1.5 rounded-tl text-[6px] font-black uppercase tracking-widest leading-none">Item</th>
                                        <th className="p-1.5 text-[6px] font-black uppercase tracking-widest text-center leading-none">Qty</th>
                                        <th className="p-1.5 text-[6px] font-black uppercase tracking-widest text-right leading-none">Rate</th>
                                        <th className="p-1.5 text-[6px] font-black uppercase tracking-widest text-right leading-none">Tax</th>
                                        <th className="p-1.5 rounded-tr text-[6px] font-black uppercase tracking-widest text-right leading-none">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-1 px-1.5 text-[7px] font-bold text-black tracking-tight leading-tight">{item.description}</td>
                                            <td className="p-1 px-1.5 text-[7px] font-medium text-center leading-none">{item.quantity}</td>
                                            <td className="p-1 px-1.5 text-[7px] font-medium text-right leading-none">{data.currencySymbol}{item.rate.toFixed(2)}</td>
                                            <td className="p-1 px-1.5 text-[7px] font-medium text-right leading-none">{item.tax}%</td>
                                            <td className="p-1 px-1.5 text-[7px] font-black text-right leading-none">{data.currencySymbol}{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="flex justify-end pt-1">
                                <div className="w-28 space-y-0.5">
                                    <div className="flex justify-between text-[6px]">
                                        <span className="text-black/40 font-bold uppercase">Sub</span>
                                        <span className="text-black font-bold">{data.currencySymbol}{data.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[6px]">
                                        <span className="text-black/40 font-bold uppercase">Tax</span>
                                        <span className="text-black font-bold">{data.currencySymbol}{data.taxAmount.toFixed(2)}</span>
                                    </div>
                                    {data.discountAmount !== undefined && data.discountAmount > 0 && (
                                        <div className="flex justify-between text-[6px] text-amber-600">
                                            <span className="font-bold uppercase">Off</span>
                                            <span className="font-bold">-{data.currencySymbol}{data.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-0.5 border-t border-[var(--primary-green)]">
                                        <span className="text-[8px] font-black uppercase text-[var(--primary-green)] leading-none pt-0.5">Total</span>
                                        <span className="text-[10px] font-black text-black leading-none pt-0.5">{data.currencySymbol}{data.totalAmount.toFixed(2)}</span>
                                    </div>

                                    {data.paidAmount !== undefined && data.paidAmount > 0 && (
                                        <div className="flex justify-between text-[6px] pt-0.5">
                                            <span className="text-emerald-600 font-bold uppercase">Paid</span>
                                            <span className="text-emerald-600 font-bold">{data.currencySymbol}{data.paidAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {data.balanceAmount !== undefined && data.balanceAmount > 0 && (
                                        <div className="flex justify-between text-[6px]">
                                            <span className="text-rose-600 font-bold uppercase">Due</span>
                                            <span className="text-rose-600 font-bold">{data.currencySymbol}{data.balanceAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {data.notes && (
                                <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-[var(--primary-green)] mt-8">
                                    <h4 className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">ADDITIONAL NOTES</h4>
                                    <p className="text-xs text-black/80 leading-relaxed font-medium">{data.notes}</p>
                                </div>
                            )}

                            {/* Attachments / Proof */}
                            {data.attachments && data.attachments.length > 0 && (
                                <div className="mt-12 space-y-4">
                                    <h4 className="text-[10px] font-black text-black/40 uppercase tracking-widest border-b border-black/5 pb-1">ATTACHMENTS / RECORDED PROOF</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {data.attachments.map((url, idx) => (
                                            <div key={idx} className="rounded-xl overflow-hidden border border-black/5 bg-slate-50">
                                                <img
                                                    src={url}
                                                    className="w-full h-48 object-contain bg-white"
                                                    alt={`Proof ${idx + 1}`}
                                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/200?text=Attachment+Error')}
                                                />
                                                <div className="p-3 text-[9px] font-black text-black/40 text-center uppercase tracking-widest bg-white border-t border-black/5">
                                                    RECORDED PROOF DOCUMENT #{idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Signature */}
                            <div className="mt-16 flex justify-end">
                                <div className="text-center w-48 space-y-2">
                                    {data.signature ? (
                                        <div className="border-b-2 border-black pb-1">
                                            <img src={data.signature} className="h-16 mx-auto object-contain" alt="Signature" />
                                        </div>
                                    ) : (
                                        <div className="h-16 border-b-2 border-black/10" />
                                    )}
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest pt-1">AUTHORIZED SIGNATURE</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 p-4 border-t border-black/5 text-center mt-auto">
                            <p className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em]">
                                Generated by Claire • Official Transaction Document
                            </p>
                            <p className="text-[6px] font-medium text-black/30 mt-0.5">
                                {data.businessAddress} • {data.businessPhone}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Mobile Only or Extra Info */}
                <div className="p-4 border-t border-black/5 bg-white/50 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">
                    Safe & Secure Cloud Ledger
                </div>
            </div>
        </div>
    )
}
