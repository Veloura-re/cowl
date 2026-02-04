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
        size?: 'A4' | 'THERMAL' | 'NANO'
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
    const [accentColor, setAccentColor] = useState(initialSettings?.accentColor || '#111827')
    const [footerNote, setFooterNote] = useState(initialSettings?.footerNote || '')
    const [size, setSize] = useState<'A4' | 'THERMAL' | 'NANO'>(initialSettings?.size || 'A4')
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
                className="relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a] text-white"
            >
                {/* Decorative Background Mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[80px]" />
                </div>

                {/* Header */}
                <div className="relative px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white/90">Invoice Design</h2>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Customize Appearance</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                        <X className="h-4 w-4 text-white/60" />
                    </button>
                </div>

                <div className="relative p-6 space-y-6">
                    {/* Size Selector */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            <LayoutTemplate className="h-3 w-3" />
                            Paper Format
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSize('A4')}
                                className={clsx(
                                    "relative h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group",
                                    size === 'A4'
                                        ? "border-[var(--primary-green)] bg-[var(--primary-green)]/10 text-white"
                                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <div className="w-8 h-10 border border-current rounded-sm bg-current/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest">A4 Standard</span>
                                {size === 'A4' && (
                                    <motion.div
                                        layoutId="check"
                                        className="absolute top-2 right-2 h-5 w-5 bg-[var(--primary-green)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/40"
                                    >
                                        <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                )}
                            </button>
                            <button
                                onClick={() => setSize('THERMAL')}
                                className={clsx(
                                    "relative h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group",
                                    size === 'THERMAL'
                                        ? "border-[var(--primary-green)] bg-[var(--primary-green)]/10 text-white"
                                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <div className="w-6 h-10 border border-current rounded-sm bg-current/10 flex flex-col gap-0.5 p-0.5 overflow-hidden">
                                    <div className="h-0.5 w-full bg-current/40" />
                                    <div className="h-0.5 w-full bg-current/40" />
                                    <div className="h-0.5 w-3/4 bg-current/40" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Thermal (80mm)</span>
                                {size === 'THERMAL' && (
                                    <motion.div
                                        layoutId="check"
                                        className="absolute top-2 right-2 h-5 w-5 bg-[var(--primary-green)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/40"
                                    >
                                        <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                )}
                            </button>
                            <button
                                onClick={() => setSize('NANO')}
                                className={clsx(
                                    "relative h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group",
                                    size === 'NANO'
                                        ? "border-[var(--primary-green)] bg-[var(--primary-green)]/10 text-white"
                                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <div className="w-4 h-10 border border-current rounded-sm bg-current/10 flex flex-col gap-0.5 p-0.5 overflow-hidden">
                                    <div className="h-0.5 w-full bg-current/60" />
                                    <div className="h-0.5 w-full bg-current/60" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-center px-1">Nano (58mm)</span>
                                {size === 'NANO' && (
                                    <motion.div
                                        layoutId="check"
                                        className="absolute top-2 right-2 h-5 w-5 bg-[var(--primary-green)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/40"
                                    >
                                        <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            <Palette className="h-3 w-3" />
                            Brand Accent
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setAccentColor(color.value)}
                                    className={clsx(
                                        "h-10 w-10 rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative",
                                        accentColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-80 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                >
                                    {accentColor === color.value && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            <Type className="h-3 w-3" />
                            Footer / Terms
                        </label>
                        <textarea
                            value={footerNote}
                            onChange={(e) => setFooterNote(e.target.value)}
                            placeholder="e.g. Thank you for your business! Payments are due within 14 days."
                            className="w-full h-32 rounded-2xl bg-white/5 border border-white/10 p-4 text-[11px] font-bold text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="relative p-6 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="relative w-full h-14 rounded-2xl overflow-hidden group disabled:opacity-50 bg-[var(--primary-green)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                        <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Configuration
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
