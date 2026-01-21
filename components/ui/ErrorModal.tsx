"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
}

export default function ErrorModal({
    isOpen,
    onClose,
    title = "ERROR OCCURRED",
    message,
}: ErrorModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm glass-error overflow-hidden rounded-[32px] border border-white/40 shadow-2xl bg-white/90"
                    >
                        {/* Status Bar */}
                        <div className="bg-rose-500/10 px-6 py-3 flex items-center justify-between border-b border-rose-500/10">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-500 font-bold" />
                                <span className="text-xs lg:text-[10px] font-black uppercase tracking-wider text-rose-600">
                                    {title}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                            >
                                <X className="h-4 w-4 text-rose-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight leading-tight">
                                    Something went wrong
                                </h4>
                                <p className="text-xs font-semibold text-[var(--foreground)]/60 leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full h-14 lg:h-12 rounded-2xl bg-[var(--deep-contrast)] text-white text-xs lg:text-[11px] font-black uppercase tracking-wider shadow-xl shadow-black/10 hover:bg-rose-600 transition-all active:scale-95"
                            >
                                Dismiss
                            </button>
                        </div>

                        {/* Aesthetic Gradient Bottom */}
                        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
