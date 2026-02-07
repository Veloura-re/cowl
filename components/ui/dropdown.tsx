'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

interface DropdownOption {
    value: string
    label: string
}

interface DropdownProps {
    options: DropdownOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    icon?: React.ReactNode
}

export default function Dropdown({ options, value, onChange, placeholder, className, icon }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div ref={dropdownRef} className={clsx("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center justify-between gap-2 px-3 py-2 text-[14px] font-bold rounded-xl glass border border-white/40 dark:border-white/10 transition-all uppercase tracking-wider min-w-[140px]",
                    isOpen ? "border-[var(--primary-green)] bg-white/60 dark:bg-white/10" : "hover:border-[var(--primary-green)]/50"
                )}
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[var(--deep-contrast)]">{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={clsx(
                    "h-3.5 w-3.5 text-[var(--foreground)]/40 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="glass rounded-xl border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-neutral-950/90">
                        <div className="py-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value)
                                        setIsOpen(false)
                                    }}
                                    className={clsx(
                                        "w-full px-3 py-2 text-[14px] font-bold uppercase tracking-wider text-left transition-all flex items-center justify-between group",
                                        option.value === value
                                            ? "bg-[var(--primary-green)]/10 text-[var(--primary-green)]"
                                            : "text-[var(--deep-contrast)] hover:bg-white/60 dark:hover:bg-white/10"
                                    )}
                                >
                                    <span>{option.label}</span>
                                    {option.value === value && (
                                        <Check className="h-3.5 w-3.5 text-[var(--primary-green)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
