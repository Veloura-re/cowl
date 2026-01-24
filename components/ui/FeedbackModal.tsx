'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, X, ShieldCheck, ShieldAlert } from 'lucide-react'
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
                        className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="glass w-full max-w-sm rounded-[32px] border border-[var(--foreground)]/10 shadow-2xl overflow-hidden relative z-10 p-8 text-center"
                    >
                        <div className={clsx(
                            "mx-auto h-20 w-20 rounded-[28px] flex items-center justify-center mb-6 shadow-2xl transition-transform duration-500",
                            isError ? "bg-rose-500 shadow-rose-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                        )}>
                            {isError ? (
                                <ShieldAlert className="h-10 w-10 text-white" />
                            ) : (
                                <ShieldCheck className="h-10 w-10 text-white" />
                            )}
                        </div>

                        <div className="space-y-2 mb-8">
                            <h3 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight uppercase">
                                {title || (isError ? 'Action Denied' : 'Verification Success')}
                            </h3>
                            <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] leading-relaxed max-w-[220px] mx-auto">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className={clsx(
                                "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95",
                                isError
                                    ? "bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] hover:bg-rose-500 hover:text-white shadow-black/10"
                                    : "bg-[var(--primary-green)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-[var(--primary-green)]/20"
                            )}
                        >
                            Acknowledge
                        </button>

                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center rounded-xl text-[var(--foreground)]/20 hover:text-rose-500 transition-all hover:bg-[var(--foreground)]/5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
