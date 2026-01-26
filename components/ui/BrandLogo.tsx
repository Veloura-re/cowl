'use client'

import React from 'react'
import clsx from 'clsx'

interface BrandLogoProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
        xl: 'w-16 h-16',
    }

    return (
        <div className={clsx("flex items-center justify-center", sizeClasses[size], className)}>
            <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
            />
        </div>
    )
}
