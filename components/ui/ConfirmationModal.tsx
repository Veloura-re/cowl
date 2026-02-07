"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LucideIcon } from "lucide-react";
import clsx from "clsx";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    icon?: LucideIcon;
    variant?: 'danger' | 'primary' | 'warning';
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "CONFIRM",
    cancelLabel = "CANCEL",
    icon: Icon,
    variant = 'primary',
}: ConfirmationModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    {/* Premium Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[12px] transition-all duration-500"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="relative w-full max-w-sm overflow-hidden"
                    >
                        {/* Glass Container */}
                        <div className="glass relative p-8 rounded-[40px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-[var(--background)]/80 backdrop-blur-3xl overflow-hidden">

                            {/* Decorative Glows */}
                            <div className={clsx(
                                "absolute -top-24 -right-24 w-48 h-48 blur-[64px] rounded-full pointer-events-none",
                                variant === 'danger' ? "bg-rose-500/20" :
                                    variant === 'warning' ? "bg-amber-500/20" : "bg-emerald-500/10"
                            )} />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--primary-green)]/10 blur-[64px] rounded-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Glowing Icon Box (Optional) */}
                                {Icon && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring" }}
                                        className="relative mb-8"
                                    >
                                        <div className={clsx(
                                            "absolute inset-0 blur-2xl rounded-full animate-pulse",
                                            variant === 'danger' ? "bg-rose-500/30" :
                                                variant === 'warning' ? "bg-amber-500/30" : "bg-emerald-500/30"
                                        )} />
                                        <div className={clsx(
                                            "relative h-20 w-20 flex items-center justify-center rounded-[32px] border border-white/20 shadow-lg",
                                            variant === 'danger' ? "bg-gradient-to-br from-rose-500 to-rose-600" :
                                                variant === 'warning' ? "bg-gradient-to-br from-amber-500 to-amber-600" :
                                                    "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                        )}>
                                            <Icon size={32} className="text-white" />
                                        </div>
                                    </motion.div>
                                )}

                                <h3 className="text-2xl font-black text-[var(--deep-contrast)] uppercase tracking-tight mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm font-medium text-[var(--foreground)]/60 mb-10 px-4 leading-relaxed">
                                    {description}
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={onConfirm}
                                        className={clsx(
                                            "group relative w-full py-4 rounded-[24px] text-white text-xs font-black uppercase tracking-widest overflow-hidden transition-all active:scale-[0.98] shadow-xl",
                                            variant === 'danger' ? "bg-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40" :
                                                variant === 'warning' ? "bg-amber-600 shadow-amber-500/25 hover:shadow-amber-500/40" :
                                                    "bg-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r",
                                            variant === 'danger' ? "from-rose-500 to-rose-700" :
                                                variant === 'warning' ? "from-amber-400 to-amber-600" :
                                                    "from-emerald-500 to-emerald-700"
                                        )} />
                                        <span className="relative z-10">{confirmLabel}</span>
                                    </button>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 rounded-[24px] bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] text-[14px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                                    >
                                        {cancelLabel}
                                    </button>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--foreground)]/5 hover:bg-rose-500 hover:text-white transition-all group border border-white/5"
                            >
                                <X size={16} className="transition-transform group-hover:rotate-90" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
