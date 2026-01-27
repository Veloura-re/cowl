'use client'

import React from 'react'
import clsx from 'clsx'
import { BusinessContext } from '@/context/business-context'

interface BrandLogoProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    url?: string
}

export function BrandLogo({ className, size = 'md', url }: BrandLogoProps) {
    const context = React.useContext(BusinessContext)
    const activeBusiness = context?.businesses.find(b => b.id === context.activeBusinessId)

    const logoUrl = url || activeBusiness?.logo_url || "/logo.png"

    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
        xl: 'w-16 h-16',
    }

    return (
        <div className={clsx("flex items-center justify-center overflow-hidden", sizeClasses[size], className)}>
            <img
                src={logoUrl}
                alt={activeBusiness?.name || "Logo"}
                className="w-full h-full object-contain"
                onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/logo.png"
                }}
            />
        </div>
    )
}
