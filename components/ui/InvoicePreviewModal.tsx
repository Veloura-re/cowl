'use client'

import { X, Printer, Download, Share2, Mail, MessageCircle } from 'lucide-react'
import { InvoiceData, shareInvoice, downloadInvoice } from '@/utils/invoice-generator'
import { format } from 'date-fns'
import clsx from 'clsx'
import { formatNumber } from '@/lib/format-number'

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

    const handleEmailShare = () => {
        const subject = encodeURIComponent(`Invoice ${data.invoiceNumber} from ${data.businessName}`)
        const body = encodeURIComponent(
            `Dear ${data.partyName},\n\n` +
            `Please find the details of Invoice ${data.invoiceNumber}:\n\n` +
            `Total Amount: ${data.currencySymbol}${formatNumber(data.totalAmount)}\n` +
            `Status: ${data.status}\n` +
            `Date: ${data.date}\n\n` +
            `Thank you for your business!\n\n` +
            `Best regards,\n${data.businessName}`
        )
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    }

    const handleWhatsAppShare = () => {
        const message = encodeURIComponent(
            `*Invoice ${data.invoiceNumber}*\n` +
            `From: ${data.businessName}\n` +
            `To: ${data.partyName}\n\n` +
            `📋 *Invoice Details:*\n` +
            `Amount: ${data.currencySymbol}${formatNumber(data.totalAmount)}\n` +
            `Status: ${data.status}\n` +
            `Date: ${data.date}\n\n` +
            `Thank you for your business! 🙏`
        )
        window.open(`https://wa.me/?text=${message}`, '_blank')
    }

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
                            onClick={() => shareInvoice(data)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                            title="Share"
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Share</span>
                        </button>
                        <button
                            onClick={handleEmailShare}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg active:scale-95 hidden md:flex"
                            title="Share via Email"
                        >
                            <Mail className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Email</span>
                        </button>
                        <button
                            onClick={handleWhatsAppShare}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg active:scale-95 hidden md:flex"
                            title="Share via WhatsApp"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">WhatsApp</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                            title="Print"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Print</span>
                        </button>
                        <button
                            onClick={() => downloadInvoice(data)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--deep-contrast)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all shadow-lg active:scale-95"
                            title="Download PDF"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Download</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--foreground)]/5 transition-all text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f3f3f3] custom-scrollbar">
                    <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl overflow-hidden flex flex-col min-h-[297mm] p-[40px] text-black font-['Inter'] relative">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex-1">
                                {data.businessLogoUrl && (
                                    <img
                                        src={data.businessLogoUrl}
                                        alt="Logo"
                                        className="h-[50px] w-auto object-contain mb-4 grayscale filter block"
                                    />
                                )}
                                <h1 className="text-2xl font-black uppercase tracking-tight">{data.businessName}</h1>
                                <div className="text-[9px] font-mono uppercase tracking-wider mt-2 leading-relaxed text-neutral-500">
                                    <p>{data.businessAddress}</p>
                                    <p>{data.businessPhone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-block border border-black px-3 py-1 text-[10px] font-mono font-bold uppercase mb-3">
                                    {data.status}
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-2">{isSale ? 'INVOICE' : 'PURCHASE'}</h2>
                                <div className="text-[11px] font-mono">
                                    <div className="mb-0.5"><span className="text-neutral-500">NO.</span> <span className="font-bold">{data.invoiceNumber}</span></div>
                                    <div><span className="text-neutral-500">DATE</span> <span className="font-bold">{data.date}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-10 py-6 border-y-2 border-black mb-10">
                            <div>
                                <p className="text-[9px] font-mono uppercase text-neutral-500 mb-2 tracking-widest">ISSUED TO</p>
                                <p className="text-sm font-black uppercase tracking-tight">{data.partyName}</p>
                                <p className="text-[11px] font-mono mt-1 text-neutral-800">{data.partyAddress || 'Address Not Provided'}</p>
                                <p className="text-[11px] font-mono mt-0.5 text-neutral-800">{data.partyPhone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-mono uppercase text-neutral-500 mb-2 tracking-widest">PAYMENT DETAILS</p>
                                <p className="text-[11px] font-mono mb-1">DUE DATE: <span className="font-bold">{data.dueDate || 'ON RECEIPT'}</span></p>
                                <p className="text-[11px] font-mono">CURRENCY: <span className="font-bold">{data.currency.toUpperCase()}</span></p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full border-collapse mb-8">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="text-left font-mono text-[9px] uppercase tracking-wider text-black pb-2 pl-1 w-1/2">DESCRIPTION</th>
                                    <th className="text-center font-mono text-[9px] uppercase tracking-wider text-black pb-2 w-[10%]">QTY</th>
                                    <th className="text-right font-mono text-[9px] uppercase tracking-wider text-black pb-2 w-[15%]">RATE</th>
                                    <th className="text-right font-mono text-[9px] uppercase tracking-wider text-black pb-2 w-[10%]">TAX</th>
                                    <th className="text-right font-mono text-[9px] uppercase tracking-wider text-black pb-2 w-[15%] pr-1">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="text-[12px]">
                                {data.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-neutral-200 last:border-b-2 last:border-black">
                                        <td className="py-3 pl-1 font-bold">{item.description}</td>
                                        <td className="py-3 text-center font-mono">{item.quantity}</td>
                                        <td className="py-3 text-right font-mono text-neutral-600">{formatNumber(item.rate)}</td>
                                        <td className="py-3 text-right font-mono text-neutral-600">{item.tax}%</td>
                                        <td className="py-3 pr-1 text-right font-mono font-bold">{data.currencySymbol}{formatNumber(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-auto">
                            <div className="w-[300px] space-y-1">
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-neutral-500">SUBTOTAL</span>
                                    <span>{data.currencySymbol}{formatNumber(data.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-neutral-500">TAX</span>
                                    <span>{data.currencySymbol}{formatNumber(data.taxAmount)}</span>
                                </div>
                                {data.discountAmount ? (
                                    <div className="flex justify-between text-[11px] font-mono text-neutral-800">
                                        <span className="text-neutral-500">DISCOUNT</span>
                                        <span>-{data.currencySymbol}{formatNumber(data.discountAmount)}</span>
                                    </div>
                                ) : null}

                                <div className="flex justify-between items-center py-3 mt-2 border-y-2 border-black">
                                    <span className="text-sm font-black uppercase tracking-widest">TOTAL</span>
                                    <span className="text-lg font-black font-mono">{data.currencySymbol}{formatNumber(data.totalAmount)}</span>
                                </div>

                                {data.paidAmount ? (
                                    <div className="flex justify-between text-[11px] font-mono mt-2 pt-1">
                                        <span className="text-neutral-500 uppercase">Amount Paid</span>
                                        <span>{data.currencySymbol}{formatNumber(data.paidAmount)}</span>
                                    </div>
                                ) : null}
                                {data.balanceAmount ? (
                                    <div className="flex justify-between text-[11px] font-mono">
                                        <span className="text-neutral-500 uppercase">Balance Due</span>
                                        <span>{data.currencySymbol}{formatNumber(data.balanceAmount)}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-4 border-t border-black flex items-end justify-between">
                            <div className="flex-1">
                                {data.notes && (
                                    <div className="max-w-xs">
                                        <p className="text-[9px] font-bold uppercase mb-1">NOTES</p>
                                        <p className="text-[10px] text-neutral-500 leading-relaxed uppercase">{data.notes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                {data.signature ? (
                                    <img src={data.signature} className="h-8 mb-2 ml-auto object-contain grayscale" alt="Signature" />
                                ) : <div className="h-8" />}
                                <p className="text-[9px] font-bold uppercase tracking-wider">AUTHORIZED SIGNATURE</p>
                                <p className="text-[9px] font-mono text-neutral-400 mt-1 uppercase">GENERATED BY COWL SYSTEM</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
