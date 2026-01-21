'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser, Check } from 'lucide-react'

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
        <div className={`space-y-2 ${className}`}>
            <div className="border border-[var(--primary-green)]/20 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-inner relative group">
                <SignatureCanvas
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-32 cursor-crosshair',
                    }}
                    onBegin={() => setHasSignature(true)}
                />
                {/* Placeholder text if empty */}
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Sign Here</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-[var(--foreground)]/50 px-1">
                <span>Digital Signature</span>
                <button
                    onClick={() => {
                        sigPad.current?.clear()
                        setHasSignature(false)
                    }}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                    type="button"
                >
                    <Eraser className="h-3 w-3" />
                    Clear
                </button>
            </div>
        </div>
    )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
