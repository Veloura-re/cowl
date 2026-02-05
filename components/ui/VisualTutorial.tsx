'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles, Command } from 'lucide-react'
import clsx from 'clsx'

export type TutorialStep = {
    title: string
    content: string
    targetId?: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface VisualTutorialProps {
    steps: TutorialStep[]
    isOpen: boolean
    onClose: () => void
    accentColor?: string
}

// Helper to convert hex to space-separated rgb for tailwind/css variables
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '16 185 129'
}

// --- COSMIC ATMOSPHERE COMPONENTS ---

const Stardust = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden origin-center">
            {[...Array(40)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute h-[1px] w-[1px] bg-white/30 rounded-full"
                    initial={{
                        x: Math.random() * 100 + '%',
                        y: Math.random() * 100 + '%',
                        opacity: Math.random() * 0.5
                    }}
                    animate={{
                        y: ['-10%', '110%'],
                        opacity: [0, 0.8, 0],
                        scale: [1, 1.5, 1]
                    }}
                    transition={{
                        duration: Math.random() * 15 + 15,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                />
            ))}
        </div>
    )
}

const MeshGradient = () => (
    <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-rgb))_0%,transparent_50%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.3)_0%,transparent_50%)] blur-[80px]"
        />
    </div>
)

// --- DYNAMIC ISLAND CONTROLLER ---

const MagneticButton = ({ children, onClick, className, primary = false }: any) => {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { damping: 15, stiffness: 150 })
    const springY = useSpring(y, { damping: 15, stiffness: 150 })

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        x.set((e.clientX - centerX) * 0.4)
        y.set((e.clientY - centerY) * 0.4)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.button
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ x: springX, y: springY }}
            whileTap={{ scale: 0.9 }}
            className={clsx(
                "relative flex items-center justify-center transition-colors overflow-hidden group font-black uppercase tracking-widest text-[10px]",
                primary
                    ? "text-white h-12 px-8 rounded-2xl border border-white/20"
                    : "bg-white/5 text-white/80 h-12 w-12 rounded-2xl border border-white/10 hover:bg-white/10 hover:text-white",
                className
            )}
        >
            {primary && (
                <>
                    {/* Dynamic Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--primary-rgb))] to-white/20 opacity-80" />
                    <div
                        className="absolute inset-0 opacity-50 shadow-[0_10px_30px_-10px_rgb(var(--primary-rgb))]"
                        style={{ boxShadow: '0 10px 30px -10px rgb(var(--primary-rgb))' }}
                    />
                </>
            )}
            {primary && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                />
            )}
            <span className="relative z-10 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                {children}
            </span>
        </motion.button>
    )
}

const VelocityText = ({ text }: { text: string }) => {
    const words = text.split(' ')
    return (
        <div className="flex flex-wrap gap-x-1.5 gap-y-1">
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.05 + i * 0.02, duration: 0.2, ease: "circOut" }}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </div>
    )
}

// --- MAIN ENGINE ---

export default function VisualTutorial({ steps, isOpen, onClose, accentColor = '#10b981' }: VisualTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Calculate RGB for CSS variables
    const primaryRgb = hexToRgb(accentColor)

    useEffect(() => {
        if (!isOpen) return

        let observer: ResizeObserver | null = null

        const updatePosition = () => {
            const step = steps[currentStep]
            if (!step?.targetId) {
                setSpotlightRect(null)
                return
            }

            // Try primary ID, then fallback to mobile variant
            let element = document.getElementById(step.targetId)

            // If primary is not visible or doesn't exist, try mobile variants
            if (!element || element.offsetWidth === 0) {
                // Special case for nav-menu
                if (step.targetId === 'nav-menu') {
                    element = document.getElementById('nav-menu-mobile') || element
                } else {
                    element = document.getElementById(`${step.targetId}-mobile`) ||
                        document.getElementById(`${step.targetId}-mobile-header`) ||
                        element
                }
            }

            if (element && element.offsetWidth > 0) {
                const rect = element.getBoundingClientRect()
                setSpotlightRect(rect)

                // Debounced scroll into view to avoid layout thrashing during resize
                const vh = window.innerHeight
                if (rect.top < 100 || rect.bottom > vh - 100) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }

                // Attach ResizeObserver to the specific target for frame-perfect tracking
                if (observer) observer.disconnect()
                observer = new ResizeObserver(() => {
                    if (element) setSpotlightRect(element.getBoundingClientRect())
                })
                observer.observe(element)
            } else {
                setSpotlightRect(null)
            }
        }

        updatePosition()

        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
            if (observer) observer.disconnect()
        }
    }, [isOpen, currentStep, steps])

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentStep(prev => prev + 1)
                setIsTransitioning(false)
            }, 100) // Faster for extreme snappiness
        } else {
            onClose()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentStep(prev => prev - 1)
                setIsTransitioning(false)
            }, 100)
        }
    }

    if (!isOpen) return null

    const step = steps[currentStep]
    if (!step) return null

    const progress = ((currentStep + 1) / steps.length) * 100

    return (
        <div
            className="fixed inset-0 z-[9999] pointer-events-none select-none font-sans"
            ref={containerRef}
            style={{
                '--primary-rgb': primaryRgb,
                '--primary-color': `rgb(${primaryRgb})`
            } as React.CSSProperties}
        >
            {/* Cinematic Backdrop - Clear Spotlight */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 pointer-events-auto"
                onClick={onClose}
            >
                <Stardust />
            </motion.div>

            {/* Fluid Morphing Spotlight */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none translate-z-0">
                <defs>
                    <mask id="tutorial-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {spotlightRect && (
                            <motion.rect
                                initial={false}
                                animate={{
                                    x: spotlightRect.left - 12,
                                    y: spotlightRect.top - 12,
                                    width: spotlightRect.width + 24,
                                    height: spotlightRect.height + 24,
                                    rx: 24,
                                }}
                                transition={{
                                    mass: 1.0
                                }}
                                fill="black"
                                className="will-change-[x,y,width,height]"
                            />
                        )}
                    </mask>
                    <filter id="spotlight-glow">
                        <feGaussianBlur stdDeviation="15" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Chromatic Aura / Border around Spotlight */}
                {spotlightRect && (
                    <motion.rect
                        initial={false}
                        animate={{
                            x: spotlightRect.left - 20,
                            y: spotlightRect.top - 20,
                            width: spotlightRect.width + 40,
                            height: spotlightRect.height + 40,
                            rx: 32,
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{
                            x: { type: 'spring', damping: 30, stiffness: 200 },
                            y: { type: 'spring', damping: 30, stiffness: 200 },
                            width: { type: 'spring', damping: 30, stiffness: 200 },
                            height: { type: 'spring', damping: 30, stiffness: 200 },
                            opacity: { duration: 2, repeat: Infinity }
                        }}
                        fill="none"
                        stroke={`rgb(${primaryRgb})`}
                        strokeWidth="2"
                        className="blur-[2px]"
                    />
                )}

                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.85)"
                    mask="url(#tutorial-spotlight-mask)"
                    className="pointer-events-auto cursor-crosshair"
                />
            </svg>

            {/* Dynamic Island Controller */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-20 pointer-events-none">
                <AnimatePresence>
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 300,
                            layout: { type: 'spring', damping: 20, stiffness: 350 }
                        }}
                        className="pointer-events-auto relative w-[90%] max-w-lg overflow-hidden glass-optimized rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] border border-white/20"
                    >
                        <MeshGradient />

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay opacity-20" />

                        <div className="relative z-10 p-8 sm:p-10">
                            {/* Island Header - Stable */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-[var(--primary-color)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary-color)]/40 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                                        <Command className="h-5 w-5 relative z-10" />
                                    </div>
                                    <div className="flex flex-col">
                                        <AnimatePresence mode="wait">
                                            <motion.h3
                                                key={step.title}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="text-sm sm:text-base font-black text-white uppercase tracking-wider"
                                            >
                                                {step.title}
                                            </motion.h3>
                                        </AnimatePresence>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Module</span>
                                            <div className="h-1 w-1 rounded-full bg-[var(--primary-color)]" />
                                            <span className="text-[8px] font-black text-[var(--primary-color)] uppercase tracking-[0.3em]">{currentStep + 1} / {steps.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ rotate: 90, scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white/40"
                                >
                                    <X className="h-5 w-5" />
                                </motion.button>
                            </div>

                            {/* Island Content Area - Transitions */}
                            <div className="min-h-[80px] sm:min-h-[100px] mb-8 relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-0"
                                    >
                                        <VelocityText text={step.content} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Island Controls - Stable */}
                            <div className="flex items-center justify-between gap-6 pt-6 border-t border-white/10">
                                {/* Miniature Map / Progress */}
                                <div className="flex gap-2">
                                    {steps.map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={false}
                                            animate={{
                                                width: i === currentStep ? 24 : 6,
                                                backgroundColor: i === currentStep ? `rgb(${primaryRgb})` : 'rgba(255, 255, 255, 0.15)',
                                                boxShadow: i === currentStep ? `0 0 15px rgba(${primaryRgb}, 0.5)` : 'none'
                                            }}
                                            className="h-1.5 rounded-full transition-all duration-200"
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center gap-3">
                                    {currentStep > 0 && (
                                        <MagneticButton onClick={prevStep}>
                                            <ChevronLeft className="h-5 w-5 text-white/60" />
                                        </MagneticButton>
                                    )}
                                    <MagneticButton primary onClick={nextStep} className="min-w-[120px]">
                                        {currentStep === steps.length - 1 ? (
                                            <>Finish odyssey <Sparkles className="h-4 w-4" /></>
                                        ) : (
                                            <>Continue <ChevronRight className="h-4 w-4" /></>
                                        )}
                                    </MagneticButton>
                                </div>
                            </div>
                        </div>

                        {/* Liquid Progress Bar */}
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                                className="h-full bg-linear-to-r from-[rgb(var(--primary-rgb))] to-white/50 shadow-[0_0_10px_rgb(var(--primary-rgb))]"
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Context Tooltip for Mouse (Follower) */}
            <MouseFollower isOpen={isOpen && !isTransitioning} label={`Step ${currentStep + 1}`} />
        </div>
    )
}

function MouseFollower({ isOpen, label }: { isOpen: boolean, label: string }) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, { damping: 25, stiffness: 250 })
    const springY = useSpring(mouseY, { damping: 25, stiffness: 250 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    style={{ x: springX, y: springY }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="fixed top-0 left-0 pointer-events-none z-[10000] ml-6 mt-6 flex flex-col items-center"
                >
                    <div className="glass-optimized px-3 py-1.5 rounded-full border border-white/30 text-[9px] font-black uppercase text-white/90 tracking-tighter whitespace-nowrap shadow-2xl">
                        {label}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
