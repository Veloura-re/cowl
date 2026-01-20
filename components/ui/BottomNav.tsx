"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Home, Plus, Settings, User, Package, Menu, ShoppingCart, Users, BarChart3, X, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Items always on the dock
const dockItems = [
    { icon: ShoppingCart, label: "Purchases", path: "/dashboard/purchases" },
    { icon: Package, label: "Inventory", path: "/dashboard/inventory" },
    { icon: Plus, label: "Sales", path: "/dashboard/sales", isAction: true },
    { icon: Users, label: "Parties", path: "/dashboard/parties" },
];

// Items in the hamburger menu
const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: CreditCard, label: "Finance", path: "/dashboard/finance" },
    { icon: BarChart3, label: "Reports", path: "/dashboard/reports" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export const BottomNav = () => {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const hiddenPaths = [
        "/dashboard/sales/new",
        "/dashboard/purchases/new",
        "/dashboard/inventory/new"
    ];

    if (!mounted || hiddenPaths.includes(pathname)) return null;

    return (
        <>
            {/* Hamburger Menu Overlay - Redesigned Card Grid */}
            <AnimatePresence>
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[60] flex flex-col justify-end p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative z-10 glass rounded-[40px] p-8 border border-white/30 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] bg-white/70 backdrop-blur-3xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Management</h3>
                                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest mt-1">Advanced Controls</p>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="h-10 w-10 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-rose-500 hover:text-white transition-all active:scale-95 group border border-white/50"
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
                                                    ? 'bg-[var(--primary-green)] text-white border-[var(--primary-green)]/30'
                                                    : 'bg-white/40 border-white/20 hover:bg-white/60 hover:border-white/40 shadow-sm'
                                            )}
                                        >
                                            <div className={clsx(
                                                "p-3 rounded-2xl transition-all shadow-lg",
                                                isActive ? 'bg-white/20 text-white' : 'bg-[var(--primary-green)]/10 text-[var(--primary-green)]'
                                            )}>
                                                <item.icon size={22} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Bottom decorative handle */}
                            <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-10 mb-2 opacity-50" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Dock - Jewel-like Glassmorphism */}
            <div
                className="fixed left-1/2 -translate-x-1/2 z-50"
                style={{ bottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))` }}
            >
                <LayoutGroup>
                    <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-white/40 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.2)] bg-white/70 backdrop-blur-2xl relative">

                        {/* Standard Dock Items */}
                        {dockItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.path}
                                    className={clsx(
                                        "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 overflow-visible group active:scale-90",
                                        isActive ? "text-white" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-[var(--primary-green)] rounded-full shadow-[0_5px_15px_-3px_rgba(6,78,59,0.4)] border border-white/20"
                                            transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
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
                                        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all px-2 py-1 rounded-lg bg-black text-white text-[8px] font-black uppercase tracking-widest pointer-events-none">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Separation Line (Subtle) */}
                        <div className="h-6 w-[1px] bg-black/5 mx-1" />

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={clsx(
                                "group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90",
                                isMenuOpen
                                    ? "bg-[var(--deep-contrast)] text-white shadow-lg"
                                    : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-black/[0.03]"
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
                </LayoutGroup>
            </div>
        </>
    );
};
