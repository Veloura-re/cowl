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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="glass w-full max-w-5xl h-[95vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-white/40 bg-white/95">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 bg-white/90 sticky top-0 z-20">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">Invoice Preview</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">A4 Standard Format</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                            title="Print"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Print</span>
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--deep-contrast)] text-white hover:bg-black transition-all shadow-lg active:scale-95"
                            title="Download PDF"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 mx-1" />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-all">
                            <X className="h-5 w-5 text-black/40" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-100/50 custom-scrollbar">
                    <div className="w-full max-w-[210mm] mx-auto bg-white shadow-2xl overflow-hidden border border-black/5 flex flex-col min-h-[297mm]">
                        {/* Internal Invoice Styling */}
                        <div className="p-12 md:p-16 space-y-8 flex-1">
                            {/* Brand Header */}
                            <div className="flex justify-between items-start border-b-4 border-[var(--primary-green)] pb-6">
                                <div>
                                    <h1 className="text-3xl font-black text-[var(--primary-green)] tracking-tighter">
                                        {isSale ? 'SALES INVOICE' : 'PURCHASE BILL'}
                                    </h1>
                                    <p className="text-sm font-bold text-black/60 mt-1 uppercase tracking-widest">{data.businessName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Document No.</p>
                                    <p className="text-xl font-black text-black">{data.invoiceNumber}</p>
                                </div>
                            </div>

                            {/* Parties Info */}
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-black/40 uppercase tracking-widest border-b border-black/5 pb-1">FROM</h3>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-black uppercase">{data.businessName}</p>
                                        <p className="text-xs text-black/60 leading-relaxed max-w-[200px]">{data.businessAddress}</p>
                                        <p className="text-xs font-bold text-black/80">{data.businessPhone}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-black/40 uppercase tracking-widest border-b border-black/5 pb-1">
                                        {isSale ? 'BILL TO' : 'SUPPLIER'}
                                    </h3>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-black uppercase">{data.partyName}</p>
                                        <p className="text-xs text-black/60 leading-relaxed max-w-[200px]">{data.partyAddress}</p>
                                        <p className="text-xs font-bold text-black/80">{data.partyPhone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates & Status */}
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-black/5">
                                <div>
                                    <p className="text-[8px] font-black text-black/40 uppercase tracking-widest mb-1 text-center">ISSUE DATE</p>
                                    <p className="text-xs font-bold text-center">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-black/40 uppercase tracking-widest mb-1 text-center">DUE DATE</p>
                                    <p className="text-xs font-bold text-center">{data.dueDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-black/40 uppercase tracking-widest mb-1 text-center">STATUS</p>
                                    <div className="flex justify-center">
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border",
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
                                        <th className="p-3 rounded-tl-lg text-[9px] font-black uppercase tracking-widest">Description</th>
                                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-center">Qty</th>
                                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-right">Rate</th>
                                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-right">Tax</th>
                                        <th className="p-3 rounded-tr-lg text-[9px] font-black uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-3 text-xs font-bold text-black tracking-tight">{item.description}</td>
                                            <td className="p-3 text-xs font-medium text-center">{item.quantity}</td>
                                            <td className="p-3 text-xs font-medium text-right">{data.currencySymbol}{item.rate.toFixed(2)}</td>
                                            <td className="p-3 text-xs font-medium text-right">{item.tax}%</td>
                                            <td className="p-3 text-xs font-black text-right">{data.currencySymbol}{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="flex justify-end pt-4">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-black/40 font-bold uppercase">Subtotal</span>
                                        <span className="text-black font-bold">{data.currencySymbol}{data.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-black/40 font-bold uppercase">Tax</span>
                                        <span className="text-black font-bold">{data.currencySymbol}{data.taxAmount.toFixed(2)}</span>
                                    </div>
                                    {data.discountAmount !== undefined && data.discountAmount > 0 && (
                                        <div className="flex justify-between text-xs text-amber-600">
                                            <span className="font-bold uppercase">Discount</span>
                                            <span className="font-bold">-{data.currencySymbol}{data.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-3 border-t-2 border-[var(--primary-green)]">
                                        <span className="text-sm font-black uppercase text-[var(--primary-green)]">Total</span>
                                        <span className="text-xl font-black text-black leading-none">{data.currencySymbol}{data.totalAmount.toFixed(2)}</span>
                                    </div>

                                    {data.paidAmount !== undefined && data.paidAmount > 0 && (
                                        <div className="flex justify-between text-xs pt-2">
                                            <span className="text-emerald-600 font-bold uppercase">Amount Paid</span>
                                            <span className="text-emerald-600 font-bold">{data.currencySymbol}{data.paidAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {data.balanceAmount !== undefined && data.balanceAmount > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-rose-600 font-bold uppercase">Balance Due</span>
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
                        <div className="bg-slate-50 p-6 border-t border-black/5 text-center mt-auto">
                            <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em]">
                                Generated by LUCY-ex System • Official Transaction Document
                            </p>
                            <p className="text-[8px] font-medium text-black/30 mt-1">
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
