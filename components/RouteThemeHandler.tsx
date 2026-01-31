'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Define the palettes directly in specific RGB/Hex formats as needed by globals.css
const THEMES = {
    sales: {
        primary: '#4f46e5', // Indigo-600
        hover: '#4338ca',   // Indigo-700
        active: '#3730a3',  // Indigo-800
        highlight: '#6366f1', // Indigo-500
        deep: '#312e81',    // Indigo-900
        rgb: '79 70 229'
    },
    purchases: {
        primary: '#d97706', // Amber-600
        hover: '#b45309',   // Amber-700
        active: '#78350f',  // Amber-900
        highlight: '#f59e0b', // Amber-500
        deep: '#451a03',    // Amber-950
        rgb: '217 119 6'
    },
    inventory: {
        primary: '#e11d48', // Rose-600
        hover: '#be123c',   // Rose-700
        active: '#9f1239',  // Rose-800
        highlight: '#f43f5e', // Rose-500
        deep: '#881337',    // Rose-900
        rgb: '225 29 72'
    },
    finance: {
        primary: '#0284c7', // Sky-600
        hover: '#0369a1',   // Sky-700
        active: '#075985',  // Sky-800
        highlight: '#0ea5e9', // Sky-500
        deep: '#0c4a6e',    // Sky-900
        rgb: '2 132 199'
    },
    parties: {
        primary: '#7c3aed', // Violet-600
        hover: '#6d28d9',   // Violet-700
        active: '#5b21b6',  // Violet-800
        highlight: '#8b5cf6', // Violet-500
        deep: '#4c1d95',    // Violet-900
        rgb: '124 58 237'
    },
    default: {
        primary: '#059669', // Emerald-600 (Dark Mode default)
        hover: '#047857',   // Emerald-700
        active: '#064e3b',  // Emerald-900
        highlight: '#10b981', // Emerald-500
        deep: '#064e3b',    // Emerald-900
        rgb: '16 185 129'
    }
}

export function RouteThemeHandler() {
    const pathname = usePathname()

    useEffect(() => {
        let theme = THEMES.default

        if (pathname.startsWith('/dashboard/sales')) theme = THEMES.sales
        else if (pathname.startsWith('/dashboard/purchases')) theme = THEMES.purchases
        else if (pathname.startsWith('/dashboard/inventory')) theme = THEMES.inventory
        else if (pathname.startsWith('/dashboard/finance')) theme = THEMES.finance
        else if (pathname.startsWith('/dashboard/parties')) theme = THEMES.parties

        const root = document.documentElement

        // We override the --primary-green variable which is used everywhere as the main brand color
        // This is a "hack" to repurpose the existing variable structure without refactoring the whole app
        // DIABLED: User requested to keep buttons green.
        // root.style.setProperty('--primary-green', theme.primary)
        // root.style.setProperty('--primary-hover', theme.hover)
        // root.style.setProperty('--primary-active', theme.active)
        // root.style.setProperty('--glass-highlight', theme.highlight)

        // Also update the RGB variable used for transperancy (e.g. bg-primary/20) if you use tailwind's opacity modifiers with custom properties
        // However, standard CSS vars don't support opacity modifiers unless defined as R G B.
        // We injected --primary-rgb in VisualTutorial, let's make it global too for consistency
        // root.style.setProperty('--primary-rgb', theme.rgb)

    }, [pathname])

    return null
}
