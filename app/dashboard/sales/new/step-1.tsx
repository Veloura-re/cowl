'use client'

import { useState } from 'react'
import { ArrowRight, Calendar, Hash, Building, Plus } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import PickerModal from '@/components/ui/PickerModal'
import clsx from 'clsx'

type Step1Props = {
    parties: any[]
    onNext: () => void
    onBack: () => void
}

export default function Step1PartyInfo({ parties, onNext, onBack }: Step1Props) {
    const { data, updateData } = useInvoice()
    const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false)
    const [error, setError] = useState('')

    const handleNext = () => {
        if (!data.partyId) {
            setError('Please select a customer')
            return
        }
        setError('')
        onNext()
    }

    const handlePartySelect = (id: string) => {
        const party = parties.find(p => p.id === id)
        updateData({
            partyId: id,
            partyName: party?.name || ''
        })
        setError('')
    }

    return (
        <div className="glass rounded-[32px] border border-[var(--foreground)]/10 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <div className="px-8 py-6 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-[12px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Identity & Logistics</h2>
                    <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Specify commercial entities and temporal markers</p>
                </div>
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center relative z-10">
                    <Calendar size={18} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-none" />
            </div>

            <div className="p-8 space-y-8">
                {/* Customer Selection - Large Card */}
                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 ml-2">
                        Target Recipient Account *
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsPartyPickerOpen(true)}
                        className={clsx(
                            "w-full h-24 rounded-[32px] border-2 transition-all text-left flex items-center px-8 relative group overflow-hidden shadow-sm",
                            data.partyId
                                ? "bg-[var(--primary-green)]/5 border-[var(--primary-green)]/40 ring-8 ring-[var(--primary-green)]/5"
                                : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 hover:border-[var(--primary-green)]/50",
                            error && !data.partyId && "border-rose-500/50"
                        )}
                    >
                        <div className={clsx(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                            data.partyId ? "bg-[var(--primary-green)] text-white" : "bg-[var(--foreground)]/10 text-[var(--foreground)]/30"
                        )}>
                            <Building className="h-6 w-6" />
                        </div>

                        <div className="ml-6 min-w-0 flex-1">
                            {data.partyId ? (
                                <>
                                    <div className="text-[14px] font-black text-[var(--deep-contrast)] uppercase tracking-tight truncate leading-none mb-1.5">
                                        {data.partyName}
                                    </div>
                                    <div className="text-[9px] font-black text-[var(--primary-green)] uppercase tracking-[0.2em]">
                                        AUTHENTICATED CLIENT
                                    </div>
                                </>
                            ) : (
                                <div className="text-[11px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em]">
                                    SELECT RECIPIENT...
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-8 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4" />
                        </div>

                        {/* Decorative background gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary-green)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {error && !data.partyId && (
                        <p className="text-[9px] font-black text-rose-500 mt-2 ml-4 animate-bounce uppercase tracking-widest">{error}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Invoice Number */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 ml-2">
                            <Hash className="h-3.5 w-3.5 opacity-40" />
                            Internal Identifier
                        </label>
                        <input
                            type="text"
                            value={data.invoiceNumber}
                            onChange={(e) => updateData({ invoiceNumber: e.target.value })}
                            className="w-full h-14 rounded-[24px] bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-6 text-[13px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 focus:outline-none shadow-inner transition-all uppercase placeholder:opacity-10"
                            placeholder="REF-XXXXXX"
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/30 ml-2">
                            <Calendar className="h-3.5 w-3.5 opacity-40" />
                            Temporal Marker
                        </label>
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => updateData({ date: e.target.value })}
                            className="w-full h-14 rounded-[24px] bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-6 text-[13px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 focus:outline-none shadow-inner transition-all"
                        />
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        onClick={onBack}
                        className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--deep-contrast)] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--foreground)]/10 transition-all active:scale-95"
                    >
                        <div className="h-6 w-6 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center">
                            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                        </div>
                        REVERT TO LINE
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-[2] h-14 flex items-center justify-center gap-4 rounded-2xl bg-[var(--primary-green)] text-white font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[var(--primary-hover)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 group"
                    >
                        EXECUTE REVIEW
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[var(--primary-green)] transition-all group-hover:scale-110">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </button>
                </div>
            </div>

            <PickerModal
                isOpen={isPartyPickerOpen}
                onClose={() => setIsPartyPickerOpen(false)}
                onSelect={handlePartySelect}
                title="Select Customer"
                options={parties.map(p => ({ id: p.id, label: p.name, subLabel: p.phone }))}
                selectedValue={data.partyId}
            />
        </div>
    )
}
