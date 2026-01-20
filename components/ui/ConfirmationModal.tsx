"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "CONFIRM",
    cancelLabel = "CANCEL",
}: ConfirmationModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="glass relative w-full max-w-sm p-6 rounded-[24px] shadow-2xl ring-1 ring-black/5 overflow-hidden"
                    >
                        <h3 className="text-lg font-black text-[var(--deep-contrast)] uppercase tracking-tight mb-2">
                            {title}
                        </h3>
                        <p className="text-sm font-medium text-[var(--foreground)]/80 mb-8 leading-relaxed">
                            {description}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 lg:py-3 px-4 rounded-xl bg-gray-50 text-gray-600 text-[11px] lg:text-[10px] uppercase font-black tracking-widest hover:bg-gray-100 transition-colors"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3.5 lg:py-3 px-4 rounded-xl bg-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/20 text-[11px] lg:text-[10px] uppercase font-black tracking-widest hover:bg-[var(--primary-green)]/90 transition-all transform active:scale-95"
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
