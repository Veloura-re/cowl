import { X, Printer, Download, Share2, ZoomIn, ZoomOut, Maximize2, Camera } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { InvoiceData, shareInvoice, downloadInvoice, generateInvoiceHTML, saveInvoiceAsImage } from '@/utils/invoice-generator'
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
    const [viewMode, setViewMode] = useState<'fit' | 'read'>('fit')
    const { resolvedTheme } = useTheme()

    if (!isOpen) return null

    const theme = (resolvedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'
    const htmlContent = generateInvoiceHTML(data, theme)
    const isA4 = true // Always A4 in new design

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/95 animate-in fade-in duration-300" onClick={onClose} />

            <div className={clsx(
                "relative flex flex-col w-full h-full sm:rounded-none overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10 bg-black",
                "max-w-6xl sm:h-[95vh]"
            )}>
                {/* Formal Header Actions */}
                <div className="relative z-20 flex items-center justify-between border-b border-white/20 px-6 py-4 bg-black shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center transition-all sm:hidden">
                            <X className="h-5 w-5 text-white" />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Document Registry</h2>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">
                                Format: A4 ISO Standard
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        <div className="flex items-center bg-white/10 p-1 mr-2 border border-white/10">
                            <button
                                onClick={() => setViewMode('fit')}
                                className={clsx(
                                    "px-3 py-1.5 transition-all text-[9px] font-bold uppercase",
                                    viewMode === 'fit' ? "bg-white text-black" : "text-white/60 hover:text-white"
                                )}
                            >
                                Fit
                            </button>
                            <button
                                onClick={() => setViewMode('read')}
                                className={clsx(
                                    "px-3 py-1.5 transition-all text-[9px] font-bold uppercase",
                                    viewMode === 'read' ? "bg-white text-black" : "text-white/60 hover:text-white"
                                )}
                            >
                                100%
                            </button>
                        </div>

                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-5 py-2 bg-white text-black hover:bg-gray-200 transition-all font-bold"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] uppercase tracking-widest hidden xs:inline">Print</span>
                        </button>

                        <button
                            onClick={async () => {
                                // On mobile/phone, we prefer Share as it's more reliable than a straight download
                                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                                if (isMobile) {
                                    await shareInvoice(data)
                                } else {
                                    downloadInvoice(data)
                                }
                            }}
                            className="flex items-center gap-2 px-5 py-2 border border-white text-white hover:bg-white/10 transition-all font-bold"
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-[10px] uppercase tracking-widest hidden xs:inline">PDF</span>
                        </button>

                        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center transition-all hidden sm:flex ml-2 border-l border-white/10 pl-2">
                            <X className="h-5 w-5 text-white hover:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Preview Area - High Contrast */}
                <div className="relative z-10 flex-1 bg-black overflow-auto scrollbar-hide flex items-start justify-center p-4 sm:p-12">
                    <div className={clsx(
                        "relative bg-white shadow-[0_0_100px_rgba(0,0,0,1)] transition-all duration-300 origin-top",
                        viewMode === 'fit' ? "scale-fit" : "scale-100",
                        "w-[210mm]"
                    )} style={{
                        transform: viewMode === 'fit' ? `scale(min(1, calc((100vw - 40px) / 210mm), calc((100vh - 160px) / 297mm)))` : undefined,
                        minHeight: '297mm'
                    }}>
                        <iframe
                            srcDoc={htmlContent}
                            className="w-full h-full border-none pointer-events-none"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                overflow: 'hidden'
                            }}
                            title="Invoice Preview"
                            scrolling="no"
                        />
                    </div>
                </div>

                {/* Bottom Bar (Mobile) - Simple */}
                <div className="sm:hidden relative z-20 flex items-center justify-around border-t border-white/20 px-6 py-5 bg-black">
                    <button
                        onClick={async () => {
                            const file = await saveInvoiceAsImage(data, false)
                            if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file as File] })) {
                                await navigator.share({
                                    title: `Invoice Screenshot`,
                                    files: [file as File]
                                })
                            } else {
                                // Fallback
                                saveInvoiceAsImage(data, true)
                            }
                        }}
                        className="flex items-center gap-2 text-white font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Camera className="h-5 w-5" />
                        Snap
                    </button>

                    <button
                        onClick={() => shareInvoice(data)}
                        className="flex items-center gap-2 text-white font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Share2 className="h-5 w-5" />
                        Share
                    </button>
                </div>
            </div>
        </div>
    )
}

