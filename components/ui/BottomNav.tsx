"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Plus, Settings, User, Package, Menu, ShoppingCart, Users, BarChart3, X, CreditCard, LogOut } from "lucide-react";
import { createClient } from '@/utils/supabase/client'
import { SignOutModal } from "./SignOutModal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Items always on the dock
const dockItems = [
    { icon: ShoppingCart, label: "Purchase", path: "/dashboard/purchases" },
    { icon: Package, label: "Stock", path: "/dashboard/inventory" },
    { icon: Plus, label: "Sell", path: "/dashboard/sales", isAction: true },
    { icon: Users, label: "People", path: "/dashboard/parties" },
];

// Items in the hamburger menu
const menuItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: CreditCard, label: "Finances", path: "/dashboard/finance" },
    { icon: CreditCard, label: "Expenses", path: "/dashboard/expenses" },
    { icon: BarChart3, label: "Business Reports", path: "/dashboard/reports" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];


export const BottomNav = () => {
    const supabase = createClient()
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <>
            {/* Hamburger Menu Overlay - Redesigned Card Grid */}
            <AnimatePresence>
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[200] flex flex-col justify-end p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 30, stiffness: 500 }}
                            className="relative z-10 glass rounded-[40px] p-8 border border-[var(--foreground)]/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] bg-[var(--background)]/95 backdrop-blur-3xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Management</h3>
                                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-1">Advanced Controls</p>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--foreground)]/5 hover:bg-rose-500 hover:text-white transition-all active:scale-95 group border border-[var(--foreground)]/10"
                                >
                                    <X size={18} className="transition-transform group-hover:rotate-90" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={clsx(
                                                "relative flex flex-col items-center gap-3 p-5 rounded-[28px] transition-all border group",
                                                isActive
                                                    ? 'bg-[var(--primary-green)] text-[var(--primary-foreground)] border-[var(--primary-foreground)]/10 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)]'
                                                    : 'bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10 shadow-sm'
                                            )}
                                        >
                                            <div className={clsx(
                                                "p-3 rounded-2xl transition-all shadow-lg",
                                                isActive ? 'bg-white/10 text-[var(--primary-foreground)]' : 'bg-[var(--primary-green)]/10 text-[var(--primary-green)]'
                                            )}>
                                                <item.icon size={22} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                                        </Link>
                                    )
                                })}

                                <button
                                    onClick={() => setIsSignOutModalOpen(true)}
                                    className={clsx(
                                        "relative flex flex-col items-center gap-3 p-5 rounded-[28px] transition-all border group",
                                        "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 shadow-sm active:scale-95"
                                    )}
                                >
                                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 group-hover:bg-white/10 group-hover:text-white transition-all shadow-lg">
                                        <LogOut size={22} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">Sign Out</span>
                                </button>
                            </div>

                            {/* Bottom decorative handle */}
                            <div className="w-12 h-1.5 bg-[var(--foreground)]/10 rounded-full mx-auto mt-10 mb-2 opacity-50" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Dock - Jewel-like Glassmorphism */}
            <div
                className="fixed left-1/2 -translate-x-1/2 z-50"
                style={{ bottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))` }}
            >
                <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-[var(--foreground)]/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] bg-[var(--background)]/95 backdrop-blur-2xl relative transition-all duration-200">

                    {/* Standard Dock Items */}
                    {dockItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                href={item.path}
                                className={clsx(
                                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 overflow-visible group active:scale-95",
                                    isActive ? "text-[var(--primary-foreground)]" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                                )}
                            >
                                {isActive && (
                                    <div
                                        className="absolute inset-0 bg-[var(--primary-green)] rounded-full shadow-[0_5px_15px_-3px_rgba(6,78,59,0.4)] border border-[var(--primary-foreground)]/10 transition-all duration-200"
                                    />
                                )}
                                <div className="relative z-10">
                                    <item.icon
                                        size={19}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={clsx(
                                            "transition-transform group-hover:scale-110",
                                            isActive ? "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" : "opacity-70"
                                        )}
                                    />
                                </div>

                                {/* Tooltip on long press/hover could go here */}
                                {!isActive && (
                                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all px-2 py-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-[8px] font-black uppercase tracking-wider pointer-events-none">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Separation Line (Subtle) */}
                    <div className="h-6 w-[1px] bg-[var(--foreground)]/10 mx-1" />

                    {/* Hamburger Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={clsx(
                            "group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95",
                            isMenuOpen
                                ? "bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg"
                                : "text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] hover:bg-[var(--foreground)]/10"
                        )}
                    >
                        <div className="relative z-10">
                            <Menu
                                size={19}
                                strokeWidth={isMenuOpen ? 2.5 : 2}
                                className={clsx(
                                    "transition-transform",
                                    isMenuOpen ? "rotate-90 scale-110" : "group-hover:rotate-12"
                                )}
                            />
                        </div>
                    </button>
                </div>
            </div>

            <SignOutModal
                isOpen={isSignOutModalOpen}
                onClose={() => !isSigningOut && setIsSignOutModalOpen(false)}
                isLoading={isSigningOut}
                onConfirm={async () => {
                    setIsSigningOut(true)
                    try {
                        await supabase.auth.signOut()
                        localStorage.clear()
                        sessionStorage.clear()
                        window.location.href = '/login'
                    } catch (error) {
                        console.error('Sign out error:', error)
                        window.location.href = '/login'
                    }
                }}
            />
        </>
    );
};
