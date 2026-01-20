'use client'

import React from 'react'
import clsx from 'clsx'

interface BrandLogoProps {
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    }

    return (
        <div className={clsx("flex flex-col justify-center gap-1.5", sizeClasses[size], className)}>
            <div className="h-1.5 w-full bg-[var(--primary-green)] rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="h-1.5 w-3/4 bg-[var(--primary-green)] rounded-full opacity-80" />
            <div className="h-1.5 w-1/2 bg-[var(--primary-green)] rounded-full opacity-60" />
        </div>
    )
}
