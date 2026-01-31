'use client'

import { useState, useEffect } from 'react'
import { X, Save, Check, Loader2, LayoutTemplate, Palette, Type } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'

interface InvoiceSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    businessId: string
    initialSettings?: {
        accentColor?: string
        footerNote?: string
        size?: 'A4' | 'THERMAL'
    }
    onSuccess?: () => void
}

const COLORS = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Black', value: '#000000' },
]

export default function InvoiceSettingsModal({ isOpen, onClose, businessId, initialSettings, onSuccess }: InvoiceSettingsModalProps) {
    const [accentColor, setAccentColor] = useState(initialSettings?.accentColor || '#000000')
    const [footerNote, setFooterNote] = useState(initialSettings?.footerNote || '')
    const [size, setSize] = useState<'A4' | 'THERMAL'>(initialSettings?.size || 'A4')
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && initialSettings) {
            setAccentColor(initialSettings.accentColor || '#000000')
            setFooterNote(initialSettings.footerNote || '')
            setSize(initialSettings.size || 'A4')
        }
    }, [isOpen, initialSettings])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    invoice_accent_color: accentColor,
                    invoice_footer_note: footerNote,
                    invoice_size: size
                })
                .eq('id', businessId)

            if (error) throw error

            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Failed to save invoice settings:', error)
            // Ideally show feedback here
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass w-full max-w-md rounded-[24px] overflow-hidden shadow-2xl relative z-10 border border-[var(--foreground)]/10 bg-[var(--background)]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--foreground)]/10 flex items-center justify-between bg-[var(--foreground)]/5">
                    <div>
                        <h2 className="text-sm font-black text-[var(--deep-contrast)] uppercase tracking-tight">Invoice Customization</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-0.5">Styling & Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--foreground)]/10 transition-colors">
                        <X className="h-4 w-4 text-[var(--foreground)]/60" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Size Selector */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/60">
                            <LayoutTemplate className="h-3 w-3" />
                            Paper Format
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSize('A4')}
                                className={clsx(
                                    "relative h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95",
                                    size === 'A4'
                                        ? "border-[var(--primary-green)] bg-[var(--primary-green)]/5 text-[var(--primary-green)]"
                                        : "border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/5 text-[var(--foreground)]/40"
                                )}
                            >
                                <div className="w-8 h-10 border border-current rounded-sm bg-current/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest">A4 Standard</span>
                                {size === 'A4' && <div className="absolute top-2 right-2 bg-[var(--primary-green)] text-white rounded-full p-0.5"><Check size={8} /></div>}
                            </button>
                            <button
                                onClick={() => setSize('THERMAL')}
                                className={clsx(
                                    "relative h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95",
                                    size === 'THERMAL'
                                        ? "border-[var(--primary-green)] bg-[var(--primary-green)]/5 text-[var(--primary-green)]"
                                        : "border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/5 text-[var(--foreground)]/40"
                                )}
                            >
                                <div className="w-6 h-10 border border-current rounded-sm bg-current/10 flex flex-col gap-0.5 p-0.5 overflow-hidden">
                                    <div className="h-0.5 w-full bg-current/40" />
                                    <div className="h-0.5 w-full bg-current/40" />
                                    <div className="h-0.5 w-3/4 bg-current/40" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Thermal (Receipt)</span>
                                {size === 'THERMAL' && <div className="absolute top-2 right-2 bg-[var(--primary-green)] text-white rounded-full p-0.5"><Check size={8} /></div>}
                            </button>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/60">
                            <Palette className="h-3 w-3" />
                            Brand Accent
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setAccentColor(color.value)}
                                    className={clsx(
                                        "h-8 w-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center",
                                        accentColor === color.value ? "border-[var(--deep-contrast)]" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                >
                                    {accentColor === color.value && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/60">
                            <Type className="h-3 w-3" />
                            Footer / Terms
                        </label>
                        <textarea
                            value={footerNote}
                            onChange={(e) => setFooterNote(e.target.value)}
                            placeholder="e.g. Thank you for your business! Payments are due within 14 days."
                            className="w-full h-24 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-3 text-[11px] font-medium text-[var(--deep-contrast)] placeholder:text-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-10 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-[var(--deep-contrast-hover)] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
