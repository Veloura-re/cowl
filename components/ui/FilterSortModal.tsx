'use client'

import { useState } from 'react'
import { Search, X, Check, ArrowUpDown, Filter, ChevronRight, Calendar, DollarSign, Tag } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export type SortOption = {
    id: string
    label: string
}

export type FilterOption = {
    id: string
    label: string
}

type FilterSortModalProps = {
    isOpen: boolean
    onClose: () => void
    sortOptions: SortOption[]
    filterOptions: FilterOption[]
    selectedSort: string
    selectedFilter: string
    onSortSelect: (id: string) => void
    onFilterSelect: (id: string) => void
    title?: string
}

export default function FilterSortModal({
    isOpen,
    onClose,
    sortOptions,
    filterOptions,
    selectedSort,
    selectedFilter,
    onSortSelect,
    onFilterSelect,
    title = "Organize List"
}: FilterSortModalProps) {
    const [activeTab, setActiveTab] = useState<'sort' | 'filter'>('sort')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="glass-optimized w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/5">
                    <div>
                        <h2 className="text-[17px] font-black text-white uppercase tracking-tight leading-none">{title}</h2>
                        <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Refine Display</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-white/5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Segmented Control */}
                <div className="p-4 pb-0">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('sort')}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'sort' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            Sort
                        </button>
                        <button
                            onClick={() => setActiveTab('filter')}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'filter' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'sort' ? (
                            <motion.div
                                key="sort"
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 mb-3">Sort Direction & Logic</p>
                                {sortOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onSortSelect(opt.id)}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative overflow-hidden",
                                            selectedSort === opt.id
                                                ? "bg-[var(--primary-green)] text-white"
                                                : "hover:bg-white/5 text-white/60 hover:text-white border border-transparent hover:border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                selectedSort === opt.id ? "bg-white/20" : "bg-white/5"
                                            )}>
                                                {opt.id.includes('date') ? <Calendar className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                            </div>
                                            <span className="text-[15px] font-black uppercase tracking-tight">{opt.label}</span>
                                        </div>
                                        {selectedSort === opt.id && <Check className="h-4 w-4" strokeWidth={3} />}
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="filter"
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 mb-3">Group by Status</p>
                                {filterOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onFilterSelect(opt.id)}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative overflow-hidden",
                                            selectedFilter === opt.id
                                                ? "bg-[var(--primary-green)] text-white"
                                                : "hover:bg-white/5 text-white/60 hover:text-white border border-transparent hover:border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                selectedFilter === opt.id ? "bg-white/20" : "bg-white/5"
                                            )}>
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <span className="text-[15px] font-black uppercase tracking-tight">{opt.label}</span>
                                        </div>
                                        {selectedFilter === opt.id && <Check className="h-4 w-4" strokeWidth={3} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-white/5 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl text-[14px] font-black uppercase tracking-wider text-white/40 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
