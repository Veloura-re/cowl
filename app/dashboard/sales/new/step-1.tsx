'use client'

import { useState } from 'react'
import { ArrowRight, Calendar, Hash } from 'lucide-react'
import { useInvoice } from '@/context/invoice-context'
import PickerModal from '@/components/ui/PickerModal'
import clsx from 'clsx'

type Step1Props = {
    parties: any[]
    onNext: () => void
}

export default function Step1PartyInfo({ parties, onNext }: Step1Props) {
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
        <div className="glass rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-[var(--primary-green)]/5">
                <h2 className="text-[11px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">Party & Basic Information</h2>
                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mt-0.5">Select customer and invoice details</p>
            </div>

            <div className="p-5 space-y-4">
                {/* Customer Selection - Large Card */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-2">
                        Customer *
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsPartyPickerOpen(true)}
                        className={clsx(
                            "w-full p-4 rounded-xl border-2 transition-all text-left",
                            data.partyId
                                ? "bg-white/60 border-[var(--primary-green)] hover:bg-white/80"
                                : "bg-white/20 border-white/30 hover:border-[var(--primary-green)]/50",
                            error && !data.partyId && "border-red-500"
                        )}
                    >
                        {data.partyId ? (
                            <div>
                                <div className="text-[11px] font-bold text-[var(--deep-contrast)] mb-0.5">
                                    {data.partyName}
                                </div>
                                <div className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">
                                    Selected Customer
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-2">
                                <div className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">
                                    Click to select customer
                                </div>
                            </div>
                        )}
                    </button>
                    {error && !data.partyId && (
                        <p className="text-[9px] font-bold text-red-500 mt-2 ml-1">{error}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Number */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-2">
                            <Hash className="h-3.5 w-3.5" />
                            Invoice Number
                        </label>
                        <input
                            type="text"
                            value={data.invoiceNumber}
                            onChange={(e) => updateData({ invoiceNumber: e.target.value })}
                            className="w-full h-9 rounded-xl bg-white/50 border border-white/30 px-3 text-[11px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/50 mb-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Invoice Date
                        </label>
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => updateData({ date: e.target.value })}
                            className="w-full h-9 rounded-xl bg-white/50 border border-white/30 px-3 text-[11px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none shadow-inner"
                        />
                    </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-3">
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary-green)] text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary-green)]/20 active:scale-95"
                    >
                        Continue to Items
                        <ArrowRight className="h-3.5 w-3.5" />
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
