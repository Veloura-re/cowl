'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Building2, Check, ChevronRight } from 'lucide-react'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import { BrandLogo } from './BrandLogo'
import clsx from 'clsx'

type Business = {
    id: string
    name: string
    isOwner: boolean
}

type BusinessSwitcherModalProps = {
    isOpen: boolean
    onClose: () => void
    businesses: Business[]
    activeBusinessId: string | null
    onSelect: (id: string) => void
    onCreateNew: () => void
}

export default function BusinessSwitcherModal({
    isOpen,
    onClose,
    businesses,
    activeBusinessId,
    onSelect,
    onCreateNew
}: BusinessSwitcherModalProps) {
    useLockBodyScroll(isOpen)
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 sm:p-6 overflow-hidden h-[100dvh] pt-[10vh] md:pt-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[var(--foreground)]/40 dark:bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm glass rounded-[32px] border border-[var(--foreground)]/10 shadow-2xl overflow-hidden bg-[var(--background)]/80"
                    >
                        {/* Header with Logo */}
                        <div className="flex flex-col items-center pt-8 pb-6 px-6 text-center border-b border-[var(--foreground)]/5 bg-[var(--foreground)]/5 relative">
                            <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-[var(--foreground)]/5 shadow-inner border border-[var(--foreground)]/10 mb-4 animate-in zoom-in-50 duration-500">
                                <BrandLogo size="xl" />
                            </div>
                            <h2 className="text-lg font-black text-[var(--deep-contrast)] tracking-tight uppercase">Claire</h2>
                            <p className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] mt-1">Identity Gateway</p>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--foreground)]/10 transition-all text-[var(--foreground)]/20 hover:text-[var(--foreground)]/60 active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Business List */}
                        <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto py-6 custom-scrollbar">
                            {businesses.map((biz) => {
                                const isActive = biz.id === activeBusinessId
                                return (
                                    <button
                                        key={biz.id}
                                        onClick={() => {
                                            onSelect(biz.id)
                                            onClose()
                                        }}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                            isActive
                                                ? "bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary-green)]/20"
                                                : "hover:bg-[var(--foreground)]/5 border border-transparent hover:border-[var(--foreground)]/10 text-[var(--deep-contrast)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={clsx(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 group-hover:rotate-6 shadow-xl relative overflow-hidden",
                                                isActive
                                                    ? "bg-white/10 text-white border border-white/20"
                                                    : "bg-[var(--foreground)]/5 text-[var(--deep-contrast)]/40 border border-[var(--foreground)]/10"
                                            )}>
                                                {/* Subtle inner glass highlight */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {biz.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black uppercase tracking-tight truncate max-w-[150px]">{biz.name}</p>
                                                <p className={clsx(
                                                    "text-[8px] font-black uppercase tracking-widest mt-1",
                                                    isActive ? "opacity-60" : "opacity-30"
                                                )}>
                                                    {biz.isOwner ? 'Principal Owner' : 'Associate Member'}
                                                </p>
                                            </div>
                                        </div>

                                        {isActive ? (
                                            <Check className="h-4 w-4 relative z-10" />
                                        ) : (
                                            <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-[var(--foreground)]/5 bg-[var(--foreground)]/5">
                            <button
                                onClick={() => {
                                    onCreateNew()
                                    onClose()
                                }}
                                className="w-full h-14 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-[var(--primary-green)] bg-[var(--primary-green)]/5 border border-[var(--primary-green)]/10 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all active:scale-95 shadow-sm group"
                            >
                                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-500" />
                                Create New Identity
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
