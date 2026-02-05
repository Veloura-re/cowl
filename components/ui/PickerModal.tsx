'use client'

import { useState } from 'react'
import { Search, X, Check, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export type Option = {
    id: string | number
    label: string
    subLabel?: string
}

type PickerModalProps = {
    isOpen: boolean
    onClose: () => void
    onSelect: (value: any) => void
    options: Option[]
    title: string
    selectedValue?: any
    footer?: React.ReactNode
    showSearch?: boolean
    autoFocus?: boolean
    action?: {
        label: string
        onClick: () => void
        icon?: React.ReactNode
    }
}

export default function PickerModal({
    isOpen,
    onClose,
    onSelect,
    options,
    title,
    selectedValue,
    footer,
    showSearch = true,
    autoFocus = false,
    action
}: PickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]/90 backdrop-blur-3xl"
            >
                {/* Header with subtle gradient */}
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 px-6 py-4 bg-gradient-to-b from-[var(--foreground)]/5 to-transparent">
                    <div>
                        <h2 className="text-[13px] font-black text-[var(--deep-contrast)] uppercase tracking-tight leading-none">{title}</h2>
                        <p className="text-[8px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em] mt-1">Registry Selector</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--foreground)]/5 hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-[var(--foreground)]/5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {showSearch && (
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/20 group-focus-within:text-[var(--primary-green)] transition-colors" />
                            <input
                                autoFocus={autoFocus}
                                type="text"
                                placeholder="Search the index..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-11 pr-4 text-[11px] font-black focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 uppercase tracking-wider"
                            />
                        </div>
                    )}

                    <div className={clsx(
                        "overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-[100px]",
                        showSearch ? "max-h-[350px]" : "max-h-[450px]"
                    )}>
                        <AnimatePresence mode="popLayout">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <motion.button
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={opt.id ?? 'undefined-opt'}
                                        onClick={() => {
                                            onSelect(opt.id ?? '')
                                            setSearchQuery('')
                                            onClose()
                                        }}
                                        className={clsx(
                                            "w-full flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 group text-left relative overflow-hidden",
                                            selectedValue === opt.id
                                                ? "bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-xl shadow-[var(--primary-green)]/30 scale-[1.02] z-10"
                                                : "hover:bg-[var(--foreground)]/5 text-[var(--deep-contrast)] hover:translate-x-1"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{opt.label}</p>
                                            {opt.subLabel && (
                                                <p className={clsx(
                                                    "text-[7.5px] font-black uppercase tracking-widest leading-none mt-1.5 transition-all tabular-nums",
                                                    selectedValue === opt.id
                                                        ? "text-white/60"
                                                        : "text-[var(--foreground)]/40"
                                                )}>
                                                    {opt.subLabel}
                                                </p>
                                            )}
                                        </div>
                                        <div className="relative z-10">
                                            {selectedValue === opt.id ? (
                                                <Check className="h-5 w-5 text-white" strokeWidth={3} />
                                            ) : (
                                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            )}
                                        </div>

                                        {/* Row Decoration */}
                                        {selectedValue === opt.id && (
                                            <div className="absolute top-0 right-0 w-24 h-full bg-white/10 blur-2xl rotate-12 translate-x-12" />
                                        )}
                                    </motion.button>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-12 text-center"
                                >
                                    <Search className="h-8 w-8 mx-auto mb-3 opacity-10" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground)]/20">Zero Matches found</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {(footer || action) && (
                    <div className="p-5 border-t border-[var(--foreground)]/10 bg-[var(--foreground)]/5 space-y-4">
                        {action && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick()
                                }}
                                className="w-full h-12 flex items-center justify-center gap-3 rounded-[20px] bg-[var(--primary-green)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[var(--primary-green)]/20 hover:bg-[var(--primary-hover)] transition-all active:scale-95 border border-white/10 group/action"
                            >
                                <div className="p-1 rounded-md bg-white/10 group-hover/action:scale-110 transition-transform">
                                    {action.icon}
                                </div>
                                {action.label}
                            </button>
                        )}
                        {footer && (
                            <div className="flex justify-center">
                                {footer}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
