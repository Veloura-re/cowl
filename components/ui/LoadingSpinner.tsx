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
            <Loader2 className={clsx("animate-spin text-[var(--primary-green)]", sizeClasses[size])} />
            {label && (
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">
                    {label}
                </p>
            )}
        </div>
    )
}
