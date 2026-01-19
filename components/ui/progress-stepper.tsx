'use client'

import { Check } from 'lucide-react'
import clsx from 'clsx'

type Step = {
    number: number
    title: string
    completed: boolean
}

type ProgressStepperProps = {
    currentStep: number
    steps: string[]
    onStepClick?: (step: number) => void
}

export default function ProgressStepper({ currentStep, steps, onStepClick }: ProgressStepperProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-white/20 -z-10">
                    <div
                        className="h-full bg-[var(--primary-green)] transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((title, index) => {
                    const stepNumber = index + 1
                    const isCompleted = stepNumber < currentStep
                    const isCurrent = stepNumber === currentStep
                    const isClickable = onStepClick && stepNumber <= currentStep

                    return (
                        <button
                            key={stepNumber}
                            onClick={() => isClickable && onStepClick(stepNumber)}
                            disabled={!isClickable}
                            className={clsx(
                                "flex flex-col items-center gap-1.5 transition-all",
                                isClickable && "cursor-pointer hover:scale-105",
                                !isClickable && "cursor-not-allowed"
                            )}
                        >
                            {/* Circle */}
                            <div className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all border-2",
                                isCompleted && "bg-[var(--primary-green)] border-[var(--primary-green)] text-white",
                                isCurrent && "bg-white border-[var(--primary-green)] text-[var(--primary-green)] shadow-lg shadow-[var(--primary-green)]/20",
                                !isCompleted && !isCurrent && "bg-white/10 border-white/30 text-white/40"
                            )}>
                                {isCompleted ? <Check className="h-3 w-3" /> : stepNumber}
                            </div>

                            {/* Label */}
                            <span className={clsx(
                                "text-[8px] font-bold uppercase tracking-wider whitespace-nowrap",
                                isCurrent && "text-[var(--primary-green)]",
                                isCompleted && "text-white/80",
                                !isCompleted && !isCurrent && "text-white/30"
                            )}>
                                {title}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
