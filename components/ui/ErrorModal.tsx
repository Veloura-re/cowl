"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ShieldAlert } from "lucide-react";
import clsx from 'clsx';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
}

export default function ErrorModal({
    isOpen,
    onClose,
    title = "SYSTEM FAULT",
    message,
}: ErrorModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-[var(--foreground)]/10"
                    >
                        {/* Status Bar */}
                        <div className="bg-rose-500/10 px-6 py-4 flex items-center justify-between border-b border-rose-500/10">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-black text-rose-500 uppercase tracking-tight truncate">{title}</h2>
                                    <p className="text-[12px] font-black text-rose-500/40 uppercase tracking-widest mt-0.5">Critical Protocol</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-500 transition-all active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 text-center">
                            <div className="space-y-3">
                                <h4 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight leading-none uppercase">
                                    Process Interrupted
                                </h4>
                                <p className="text-[14px] font-black text-[var(--foreground)]/40 tracking-widest leading-relaxed uppercase max-w-[240px] mx-auto">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--deep-contrast)]/20 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                            >
                                Dismiss Report
                            </button>
                        </div>

                        {/* Aesthetic Gradient Bottom */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 opacity-50" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
