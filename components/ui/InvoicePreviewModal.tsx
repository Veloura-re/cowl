'use client'

import { X, Printer, Download, Share2, Mail, MessageCircle } from 'lucide-react'
import { InvoiceData, shareInvoice, downloadInvoice, generateInvoiceHTML } from '@/utils/invoice-generator'
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

    const htmlContent = generateInvoiceHTML(data)
    const isThermal = data.size === 'THERMAL'

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className={clsx(
                "glass w-full flex flex-col rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]/95",
                isThermal ? "max-w-[400px] h-[80vh]" : "max-w-4xl h-[90vh]"
            )}>
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 px-6 py-4 bg-[var(--foreground)]/5 shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">Invoice Preview</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">{isThermal ? 'Thermal Receipt' : 'A4 Standard'}</p>
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
                        <div className="w-px h-6 bg-current/10 mx-1" />
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
                        <div className="w-px h-6 bg-current/10 mx-1" />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--foreground)]/5 transition-all text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-[#525659] relative flex items-center justify-center p-4">
                    <iframe
                        srcDoc={htmlContent}
                        className={clsx(
                            "bg-white shadow-2xl transition-all duration-300",
                            isThermal ? "w-[80mm] h-full rounded-sm" : "w-[210mm] h-full aspect-[210/297] rounded-sm"
                        )}
                        style={{ border: 'none' }}
                        title="Invoice Preview"
                    />
                </div>
            </div>
        </div>
    )
}

