'use client'

import React from 'react'
import { Search, ArrowUpDown, Filter } from 'lucide-react'

interface UnifiedControlBarProps {
    searchQuery: string
    setSearchQuery: (val: string) => void
    onSortClick?: () => void
    onFilterClick?: () => void
    placeholder?: string
    sortLabel?: string
    filterLabel?: string
}

export default function UnifiedControlBar({
    searchQuery,
    setSearchQuery,
    onSortClick,
    onFilterClick,
    placeholder = "Search...",
    sortLabel = "Sort",
    filterLabel = "Filter"
}: UnifiedControlBarProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/40"
                />
            </div>
            {onSortClick && (
                <button
                    onClick={onSortClick}
                    className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm active:scale-95"
                >
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                    <span>{sortLabel}</span>
                </button>
            )}
            {onFilterClick && (
                <button
                    onClick={onFilterClick}
                    className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm active:scale-95"
                >
                    <Filter className="h-3 w-3 opacity-40" />
                    <span>{filterLabel}</span>
                </button>
            )}
        </div>
    )
}
