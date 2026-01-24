'use client'

import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type LoadingSpinnerProps = {
    className?: string
    size?: 'sm' | 'md' | 'lg'
    label?: string
}

export default function LoadingSpinner({ className, size = 'md', label }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    }

    return (
        <div className={clsx("flex flex-col items-center justify-center p-8 text-center", className)}>
            <div className="relative">
                <Loader2 className={clsx("animate-spin text-[var(--primary-green)]", sizeClasses[size])} strokeWidth={3} />
                <div className={clsx("absolute inset-0 animate-ping opacity-20 bg-[var(--primary-green)] rounded-full", sizeClasses[size])} />
            </div>
            {label && (
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 animate-pulse">
                    {label}
                </p>
            )}
        </div>
    )
}
