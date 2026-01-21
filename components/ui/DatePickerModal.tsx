'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import clsx from 'clsx'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO,
    isEqual,
    startOfDay
} from 'date-fns'

type DatePickerModalProps = {
    isOpen: boolean
    onClose: () => void
    onSelect: (date: string) => void
    selectedValue?: string
    title: string
}

export default function DatePickerModal({
    isOpen,
    onClose,
    onSelect,
    selectedValue,
    title
}: DatePickerModalProps) {
    const initialDate = selectedValue ? parseISO(selectedValue) : new Date()
    const [viewDate, setViewDate] = useState(initialDate)

    // Calendar Logic
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1))
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1))

    if (!isOpen) return null

    const selectedDateObj = selectedValue ? startOfDay(parseISO(selectedValue)) : null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="glass w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 border border-white/40">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/40">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">{title}</h2>
                        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none mt-0.5">Choose a Day</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/50 transition-all opacity-40 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Month/Year Controller */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="text-xs font-bold text-[var(--deep-contrast)]">
                            {format(viewDate, 'MMMM yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-lg hover:bg-white/50 border border-transparent hover:border-white/20 transition-all"
                            >
                                <ChevronLeft className="h-4 w-4 opacity-40" />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-1.5 rounded-lg hover:bg-white/50 border border-transparent hover:border-white/20 transition-all"
                            >
                                <ChevronRight className="h-4 w-4 opacity-40" />
                            </button>
                        </div>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-[9px] font-bold text-center text-[var(--foreground)]/30 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, monthStart)
                            const isSelected = selectedDateObj ? isSameDay(day, selectedDateObj) : false
                            const isToday = isSameDay(day, new Date())

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onSelect(format(day, 'yyyy-MM-dd'))
                                        onClose()
                                    }}
                                    className={clsx(
                                        "h-10 w-full rounded-xl flex items-center justify-center text-[11px] font-bold transition-all relative",
                                        isSelected
                                            ? "bg-[var(--primary-green)] text-white shadow-lg scale-105 z-10"
                                            : isCurrentMonth
                                                ? "text-[var(--deep-contrast)] hover:bg-white/80"
                                                : "text-[var(--foreground)]/20 hover:bg-white/40",
                                        isToday && !isSelected && "text-[var(--primary-green)] bg-[var(--primary-green)]/5"
                                    )}
                                >
                                    {format(day, 'd')}
                                    {isToday && !isSelected && (
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--primary-green)] rounded-full" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-3 border-t border-white/10 bg-white/20 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">
                        <CalendarIcon className="h-3 w-3" />
                        Today: {format(new Date(), 'MMM do, yyyy')}
                    </div>
                </div>
            </div>
        </div>
    )
}
