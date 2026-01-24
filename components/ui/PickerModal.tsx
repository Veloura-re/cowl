'use client'

import { useState } from 'react'
import { Search, X, Check } from 'lucide-react'
import clsx from 'clsx'

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
    autoFocus = false
}: PickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]/80">
                <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 px-6 py-4 bg-[var(--foreground)]/5">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">{title}</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 dark:text-neutral-500 uppercase tracking-wider leading-none mt-0.5">Selection Panel</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--foreground)]/10 transition-all opacity-40 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                            <input
                                autoFocus={autoFocus}
                                type="text"
                                placeholder="Search options..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 rounded-xl bg-[var(--foreground)]/5 dark:bg-white/5 border border-[var(--foreground)]/10 dark:border-white/10 pl-9 pr-4 text-[11px] font-bold focus:outline-none transition-all shadow-inner text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20"
                            />
                        </div>
                    )}

                    <div className={clsx(
                        "overflow-y-auto space-y-1 pr-1 custom-scrollbar",
                        showSearch ? "max-h-[300px]" : "max-h-[400px]"
                    )}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id ?? 'undefined-opt'}
                                    onClick={() => {
                                        onSelect(opt.id ?? '')
                                        setSearchQuery('')
                                        onClose()
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group text-left",
                                        selectedValue === opt.id
                                            ? "bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg hover:bg-[var(--primary-hover)]"
                                            : "hover:bg-[var(--foreground)]/5 text-[var(--deep-contrast)]"
                                    )}
                                >
                                    <div>
                                        <p className="text-[11px] lg:text-[10px] font-bold tracking-tight leading-tight">{opt.label}</p>
                                        {opt.subLabel && (
                                            <p className={clsx(
                                                "text-[8px] lg:text-[7px] font-black uppercase tracking-wider leading-none mt-1.5 px-2 py-1 lg:py-0.5 rounded-full inline-block border",
                                                selectedValue === opt.id
                                                    ? "bg-white/20 text-white border-white/20"
                                                    : opt.subLabel === 'OWNER'
                                                        ? "bg-amber-100/50 text-amber-600 border-amber-200/50"
                                                        : opt.subLabel === 'JOINED TEAM'
                                                            ? "bg-blue-100/50 text-blue-600 border-blue-200/50"
                                                            : "text-[var(--foreground)]/40 border-transparent"
                                            )}>
                                                {opt.subLabel}
                                            </p>
                                        )}
                                    </div>
                                    {selectedValue === opt.id && <Check className="h-4 w-4" />}
                                </button>
                            ))
                        ) : (
                            <div className="py-10 text-center opacity-20">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No results found</p>
                            </div>
                        )}
                    </div>
                </div>

                {footer && (
                    <div className="p-3 border-t border-[var(--foreground)]/10 bg-[var(--foreground)]/5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
