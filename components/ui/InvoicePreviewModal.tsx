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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

            <div className={clsx(
                "relative flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10 bg-[#0a0a0a]",
                isThermal ? "max-w-[400px] h-[80vh]" : "max-w-4xl h-[90vh]"
            )}>
                {/* Decorative Background Mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[100px]" />
                </div>

                {/* Header Actions */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-black/20 shrink-0 backdrop-blur-md">
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tight">Invoice Preview</h2>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mt-1">{isThermal ? 'Thermal Receipt' : 'A4 Standard'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => shareInvoice(data)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95 group"
                            title="Share"
                        >
                            <Share2 className="h-4 w-4 text-white/60 group-hover:text-white" />
                            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline text-white/60 group-hover:text-white">Share</span>
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white hover:brightness-110 transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                            title="Print"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Print</span>
                        </button>
                        <button
                            onClick={() => downloadInvoice(data)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200 transition-all shadow-lg active:scale-95"
                            title="Download PDF"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Download</span>
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button onClick={onClose} className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                            <X className="h-4 w-4 text-white/60" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 flex-1 overflow-hidden bg-[#1a1a1a] flex items-center justify-center p-8">
                    {/* Dark backdrop for the iframe area */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

                    <iframe
                        srcDoc={htmlContent}
                        className={clsx(
                            "bg-white shadow-2xl transition-all duration-300 ring-1 ring-white/10",
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

