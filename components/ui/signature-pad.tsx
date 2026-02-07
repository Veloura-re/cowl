'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser, ShieldCheck, PenTool } from 'lucide-react'

export interface SignaturePadHandle {
    clear: () => void
    isEmpty: () => boolean
    getTrimmedCanvas: () => HTMLCanvasElement | null
    toDataURL: () => string | null
}

const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(({ className }, ref) => {
    const sigPad = useRef<SignatureCanvas | null>(null)
    const [hasSignature, setHasSignature] = useState(false)

    useImperativeHandle(ref, () => ({
        clear: () => {
            sigPad.current?.clear()
            setHasSignature(false)
        },
        isEmpty: () => sigPad.current?.isEmpty() ?? true,
        getTrimmedCanvas: () => sigPad.current?.getTrimmedCanvas() ?? null,
        toDataURL: () => {
            if (sigPad.current?.isEmpty()) return null
            return sigPad.current?.getTrimmedCanvas().toDataURL('image/png') ?? null
        }
    }))

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="flex-1 relative group overflow-hidden rounded-[24px] border border-[var(--foreground)]/10 bg-white dark:bg-black/20 backdrop-blur-xl shadow-xl transition-all duration-500 hover:border-[var(--primary-green)]/30 min-h-[120px]">
                {/* Visual Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,var(--primary-green),transparent_70%)] opacity-30" />
                </div>

                {/* Signature Canvas */}
                <SignatureCanvas
                    ref={sigPad}
                    penColor="currentColor" // Uses current text color (black in light, white in dark if handled) or we hardcode for contrast
                    velocityFilterWeight={0.7}
                    minWidth={1.5}
                    maxWidth={4.5}
                    canvasProps={{
                        className: 'w-full h-full cursor-crosshair relative z-10 text-[var(--deep-contrast)]',
                    }}
                    onBegin={() => setHasSignature(true)}
                />

                {/* Background UI hints */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8 px-8">
                    {/* Signature Line */}
                    <div className={`w-full h-px transition-all duration-500 ${hasSignature ? 'bg-[var(--primary-green)] shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[var(--foreground)]/10'}`} />

                    {!hasSignature && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-30">
                            <PenTool className="h-8 w-8 text-[var(--foreground)]/20 animate-pulse" />
                            <span className="text-[14px] font-black uppercase tracking-[0.3em] text-[var(--foreground)]">Place Signature Above Line</span>
                        </div>
                    )}

                    {/* Authentication Badge */}
                    <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/5">
                        <ShieldCheck className={`h-3 w-3 ${hasSignature ? 'text-[var(--primary-green)]' : 'text-[var(--foreground)]/20'}`} />
                        <span className="text-[12px] font-black uppercase tracking-wider text-[var(--foreground)]/40">Secured Digital Verification</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center px-1 shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${hasSignature ? 'bg-[var(--primary-green)] shadow-[0_0_8px_var(--primary-green)]' : 'bg-gray-300 animate-pulse'}`} />
                    <span className="text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40">
                        {hasSignature ? 'Reviewing Signature' : 'Awaiting Input'}
                    </span>
                </div>

                <button
                    onClick={() => {
                        sigPad.current?.clear()
                        setHasSignature(false)
                    }}
                    className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-500 transition-all duration-300"
                    type="button"
                >
                    <Eraser className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
                    <span className="text-[14px] font-black uppercase tracking-widest">Wipe Clear</span>
                </button>
            </div>
        </div>
    )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
