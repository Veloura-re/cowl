'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Type, Minus, Plus, RotateCcw, ChevronRight } from 'lucide-react'
import { useVisual } from '@/context/visual-context'
import clsx from 'clsx'

export default function FontScaleSettings() {
    const { fontScale, setFontScale, stage, setStage, resetToDefault } = useVisual()
    const [inputValue, setInputValue] = useState('')

    // Synchronize input value with current scale
    useEffect(() => {
        setInputValue((fontScale * 22).toFixed(1))
    }, [fontScale])

    const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const applyManualScale = () => {
        const px = parseFloat(inputValue)
        if (!isNaN(px) && px >= 8 && px <= 48) {
            setFontScale(px / 22)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[var(--primary-green)]/10 text-[var(--primary-green)]">
                    <Type className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-[17px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Typography Scale</h3>
                    <p className="text-[14px] font-medium text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Adjust Base Legibility</p>
                </div>
            </div>

            {/* Stage Selector (The "Dash" interface) */}
            <div className="relative pt-6 pb-2 px-1">
                <div className="flex justify-between items-center relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[var(--foreground)]/5 -translate-y-1/2" />

                    {/* Active Line */}
                    {stage !== -1 && (
                        <motion.div
                            className="absolute top-1/2 left-0 h-[2px] bg-[var(--primary-green)]/30 -translate-y-1/2"
                            initial={false}
                            animate={{ width: `${(stage / 4) * 100}%` }}
                        />
                    )}

                    {/* Stage Points */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <button
                            key={i}
                            onClick={() => setStage(i)}
                            className={clsx(
                                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                stage === i
                                    ? "bg-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/30 scale-110"
                                    : "bg-[var(--background)] border border-[var(--foreground)]/10 text-[var(--foreground)]/30 hover:border-[var(--primary-green)]/40"
                            )}
                        >
                            <span className="text-[14px] font-black">{i + 1}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-between mt-4 px-1">
                    <span className="text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30">Delicate</span>
                    <span className="text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 text-center">Standard</span>
                    <span className="text-[12px] font-black uppercase tracking-widest text-[var(--foreground)]/30 text-right">Maximum</span>
                </div>
            </div>

            {/* Manual Pixel Input */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--foreground)]/5">
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Precision PX</label>
                    <div className="relative group">
                        <input
                            type="number"
                            value={inputValue}
                            onChange={handleManualInput}
                            onBlur={applyManualScale}
                            onKeyDown={(e) => e.key === 'Enter' && applyManualScale()}
                            className="w-full h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-5 text-[18px] font-black text-[var(--deep-contrast)] focus:outline-none focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 transition-all shadow-inner tabular-nums"
                            placeholder="16.0"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[var(--foreground)]/20 uppercase tracking-widest pointer-events-none">
                            PX
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/40 ml-1">Current Scale</label>
                    <div className="w-full h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center justify-between px-5">
                        <span className="text-[18px] font-black text-[var(--primary-green)] tabular-nums">
                            {fontScale.toFixed(2)}x
                        </span>
                        <button
                            onClick={resetToDefault}
                            className="p-1.5 rounded-lg hover:bg-[var(--primary-green)]/10 text-[var(--foreground)]/30 hover:text-[var(--primary-green)] transition-all"
                            title="Reset to Normal"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Box */}
            <div className="mt-6 p-4 rounded-3xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 space-y-2">
                <p className="text-[13px] font-black uppercase tracking-widest text-[var(--foreground)]/30 mb-2">Instant Preview</p>
                <div className="space-y-1">
                    <p className="text-[18px] font-black text-[var(--deep-contrast)] leading-tight">The quick brown fox jumps over the lazy dog.</p>
                    <p className="text-[15px] font-medium text-[var(--foreground)]/60 leading-relaxed italic">Managing your empire with precision and ultra-thin aesthetics.</p>
                </div>
            </div>
        </div>
    )
}
