"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, Loader2 } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";

interface SignOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const SignOutModal = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: SignOutModalProps) => {
    useLockBodyScroll(isOpen);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center px-4 h-[100dvh] pt-[10vh] md:pt-0">
                    {/* Premium Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"
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

                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/20 blur-[64px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--primary-green)]/10 blur-[64px] rounded-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Glowing Icon Box */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                    className="relative mb-8"
                                >
                                    <div className="absolute inset-0 bg-rose-500/30 blur-2xl rounded-full animate-pulse" />
                                    <div className="relative h-20 w-20 flex items-center justify-center rounded-[32px] bg-gradient-to-br from-rose-500 to-rose-600 shadow-[0_12px_24px_-8px_rgba(244,63,94,0.5)] border border-white/20">
                                        <LogOut size={32} className="text-white ml-1" />
                                    </div>
                                </motion.div>

                                <h3 className="text-2xl font-black text-[var(--deep-contrast)] uppercase tracking-tight mb-2">
                                    End Session?
                                </h3>
                                <p className="text-sm font-medium text-[var(--foreground)]/60 mb-10 px-4 leading-relaxed">
                                    Are you sure you want to sign out? You'll need to re-authenticate to access your business data.
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className="group relative w-full py-4 rounded-[24px] bg-rose-600 text-white text-xs font-black uppercase tracking-widest overflow-hidden transition-all active:scale-[0.98] shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Signing Out...
                                                </>
                                            ) : (
                                                "Log Out Now"
                                            )}
                                        </span>
                                    </button>

                                    <button
                                        onClick={onClose}
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-[24px] bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        Continue Working
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
