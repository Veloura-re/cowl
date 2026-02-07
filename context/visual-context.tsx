'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type VisualContextType = {
    fontScale: number
    setFontScale: (scale: number) => void
    stage: number
    setStage: (stage: number) => void
    resetToDefault: () => void
}

const STAGES = [0.8, 0.9, 1.0, 1.2, 1.4]
const DEFAULT_STAGE = 2 // 1.0

export const VisualContext = createContext<VisualContextType | undefined>(undefined)

export function VisualProvider({ children }: { children: React.ReactNode }) {
    const [fontScale, setFontScaleState] = useState(1.0)
    const [stage, setStageState] = useState(DEFAULT_STAGE)

    useEffect(() => {
        const savedScale = localStorage.getItem('fontScale')
        const savedStage = localStorage.getItem('fontScaleStage')

        if (savedScale) {
            const scale = parseFloat(savedScale)
            setFontScaleState(scale)
            // Apply scale to document
            document.documentElement.style.setProperty('--font-scale', scale.toString())
        }

        if (savedStage) {
            setStageState(parseInt(savedStage))
        }
    }, [])

    const setFontScale = (scale: number) => {
        setFontScaleState(scale)
        localStorage.setItem('fontScale', scale.toString())
        document.documentElement.style.setProperty('--font-scale', scale.toString())

        // Try to find matching stage or set to -1 (custom)
        const matchIndex = STAGES.findIndex(s => Math.abs(s - scale) < 0.01)
        setStageState(matchIndex)
        if (matchIndex !== -1) {
            localStorage.setItem('fontScaleStage', matchIndex.toString())
        } else {
            localStorage.removeItem('fontScaleStage')
        }
    }

    const setStage = (index: number) => {
        if (index >= 0 && index < STAGES.length) {
            const scale = STAGES[index]
            setStageState(index)
            setFontScaleState(scale)
            localStorage.setItem('fontScale', scale.toString())
            localStorage.setItem('fontScaleStage', index.toString())
            document.documentElement.style.setProperty('--font-scale', scale.toString())
        }
    }

    const resetToDefault = () => {
        setStage(DEFAULT_STAGE)
    }

    return (
        <VisualContext.Provider value={{ fontScale, setFontScale, stage, setStage, resetToDefault }}>
            {children}
        </VisualContext.Provider>
    )
}

export function useVisual() {
    const context = useContext(VisualContext)
    if (context === undefined) {
        throw new Error('useVisual must be used within a VisualProvider')
    }
    return context
}
