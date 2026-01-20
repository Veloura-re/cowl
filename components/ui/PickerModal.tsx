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
}

export default function PickerModal({ isOpen, onClose, onSelect, options, title, selectedValue, footer }: PickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-white/40">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/40">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">{title}</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Selection Panel</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/50 transition-all opacity-40 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search options..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 rounded-xl bg-white/60 border border-white/20 pl-9 pr-4 text-[11px] font-bold focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        onSelect(opt.id)
                                        setSearchQuery('')
                                        onClose()
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group text-left",
                                        selectedValue === opt.id ? "bg-[var(--primary-green)] text-white shadow-lg" : "hover:bg-white/80 text-[var(--deep-contrast)]"
                                    )}
                                >
                                    <div>
                                        <p className="text-xs lg:text-[11px] font-bold tracking-tight leading-tight">{opt.label}</p>
                                        {opt.subLabel && (
                                            <p className={clsx(
                                                "text-[9px] lg:text-[8px] font-black uppercase tracking-widest leading-none mt-1.5 px-2 py-1 lg:py-0.5 rounded-full inline-block border",
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
                                <p className="text-[10px] font-bold uppercase tracking-widest">No results found</p>
                            </div>
                        )}
                    </div>
                </div>

                {footer && (
                    <div className="p-3 border-t border-white/10 bg-white/20">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
