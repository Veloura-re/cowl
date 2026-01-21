'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-sm glass rounded-[32px] border border-white/40 shadow-2xl overflow-hidden bg-white/80 p-6 text-center"
                    >
                        <div className={clsx(
                            "mx-auto h-16 w-16 rounded-[24px] flex items-center justify-center mb-4 shadow-lg",
                            variant === 'danger' ? "bg-rose-500 text-white shadow-rose-500/20" :
                                variant === 'warning' ? "bg-amber-500 text-white shadow-amber-500/20" :
                                    "bg-[var(--deep-contrast)] text-white shadow-black/20"
                        )}>
                            <AlertCircle className="h-8 w-8" />
                        </div>

                        <h3 className="text-lg font-black text-[var(--deep-contrast)] tracking-tight mb-2">
                            {title}
                        </h3>

                        <p className="text-xs lg:text-[11px] font-bold text-[var(--foreground)]/60 leading-relaxed max-w-[240px] mx-auto uppercase tracking-wide">
                            {message}
                        </p>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 rounded-2xl bg-white border border-black/5 text-[11px] lg:text-[10px] font-black uppercase tracking-wider text-[var(--foreground)]/40 hover:bg-black/5 hover:text-[var(--deep-contrast)] transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={clsx(
                                    "flex-1 h-12 rounded-2xl text-white text-[11px] lg:text-[10px] font-black uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2",
                                    variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" :
                                        variant === 'warning' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" :
                                            "bg-[var(--deep-contrast)] hover:bg-black shadow-black/20"
                                )}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {confirmText}
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--foreground)]/20 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
