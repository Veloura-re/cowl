'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

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
    useLockBodyScroll(isOpen)

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center px-4 h-[100dvh] pt-[10vh] md:pt-0">
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
                        className="relative w-full max-w-sm glass rounded-[32px] border border-[var(--foreground)]/10 shadow-2xl overflow-hidden p-6 text-center"
                    >
                        <div className={clsx(
                            "mx-auto h-16 w-16 rounded-[24px] flex items-center justify-center mb-4 shadow-lg",
                            variant === 'danger' ? "bg-rose-500 text-[var(--primary-foreground)] shadow-rose-500/20" :
                                variant === 'warning' ? "bg-amber-500 text-[var(--primary-foreground)] shadow-amber-500/20" :
                                    "bg-[var(--deep-contrast)] text-[var(--primary-foreground)] shadow-[var(--deep-contrast)]/20"
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
                                className="flex-1 h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[11px] lg:text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/10 hover:text-[var(--deep-contrast)] transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={clsx(
                                    "flex-1 h-12 rounded-2xl text-[var(--primary-foreground)] text-[11px] lg:text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-[var(--primary-foreground)]/10",
                                    variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" :
                                        variant === 'warning' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" :
                                            "bg-[var(--primary-green)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[var(--primary-green)]/20"
                                )}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {confirmText}
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--foreground)]/20 hover:text-rose-500 hover:bg-[var(--foreground)]/5 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
