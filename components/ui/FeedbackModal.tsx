'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import clsx from 'clsx'

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message: string
    variant?: 'success' | 'error'
}

export default function FeedbackModal({
    isOpen,
    onClose,
    title,
    message,
    variant = 'error'
}: FeedbackModalProps) {
    const isError = variant === 'error'

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm glass rounded-[32px] border border-white/40 shadow-2xl overflow-hidden bg-white/80 p-8 text-center"
                    >
                        <div className={clsx(
                            "mx-auto h-16 w-16 rounded-[24px] flex items-center justify-center mb-6 shadow-lg",
                            isError ? "bg-rose-500 shadow-rose-500/20" : "bg-emerald-500 shadow-emerald-500/20"
                        )}>
                            {isError ? (
                                <AlertCircle className="h-8 w-8 text-white" />
                            ) : (
                                <CheckCircle2 className="h-8 w-8 text-white" />
                            )}
                        </div>

                        <h3 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight mb-2">
                            {title || (isError ? 'Action Failed' : 'Success!')}
                        </h3>

                        <p className="text-[11px] font-bold text-[var(--foreground)]/60 leading-relaxed max-w-[220px] mx-auto uppercase tracking-wider mb-8">
                            {message}
                        </p>

                        <button
                            onClick={onClose}
                            className={clsx(
                                "w-full h-12 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95",
                                isError ? "bg-[var(--deep-contrast)] hover:bg-black" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                            )}
                        >
                            Got it
                        </button>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--foreground)]/20 hover:text-rose-500 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
