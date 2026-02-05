'use client'

import React, { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion'

export const CyberGridBackground = () => {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth mouse movement for the glow
    const springX = useSpring(mouseX, { damping: 25, stiffness: 120 })
    const springY = useSpring(mouseY, { damping: 25, stiffness: 120 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    // Use glass-highlight (#10b981) for the glow so it shines in both modes.
    // In light mode, primary-green is too dark (#064e3b), effectively black.
    const gridMask = useMotionTemplate`radial-gradient(400px circle at ${springX}px ${springY}px, white, transparent 80%)`
    const burstGradient = useMotionTemplate`radial-gradient(circle at ${springX}px ${springY}px, rgba(16,185,129,0.2), transparent 40%)`

    return (
        <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[var(--background)] transition-colors duration-100 will-change-[background-color]">
            {/* 
              LAYER 1: BASE GRID 
              Visible always, but subtle. 
              Dark Mode: Vibrantly green but dim.
              Light Mode: Dark emerald tint (instead of black). 
            */}
            <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.2]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="base-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path
                                d="M 40 0 L 0 0 0 40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-emerald-900 dark:text-[var(--primary-green)] transition-colors duration-100"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#base-grid)" />
                </svg>
            </div>

            {/* 
              LAYER 2: ACTIVE GRID (MOUSE REVEAL)
              Revealed by mouse movement. Brighter and more intense.
              Uses --glass-highlight to ensure it looks like "light" in both modes.
            */}
            <motion.div
                className="absolute inset-0 opacity-0 dark:opacity-100 mix-blend-screen pointer-events-none"
                style={{
                    maskImage: gridMask,
                    WebkitMaskImage: gridMask
                }}
            >
                <div className="absolute inset-0 opacity-60">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="active-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path
                                    d="M 40 0 L 0 0 0 40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    className="text-[var(--glass-highlight)] shadow-[0_0_10px_var(--glass-highlight)]"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#active-grid)" />
                    </svg>
                </div>

                {/* Mouse Follower Light Burst */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: burstGradient }}
                />
            </motion.div>

            {/* 
              LAYER 3: SCANNERS (The "Matrix" feel)
              Random beams of light traveling along the grid lines.
              Increased opacity for better visibility.
            */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Horizontal Scanners */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`h-${i}`}
                        className="absolute h-[1px] w-[20%] bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent opacity-50 dark:opacity-80"
                        initial={{ left: '-20%', top: `${15 + i * 30}%` }}
                        animate={{ left: '120%' }}
                        transition={{
                            duration: 5 + i * 2,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 1.5
                        }}
                        style={{
                            boxShadow: '0 0 8px var(--glass-highlight)',
                            filter: 'blur(1px)'
                        }}
                    />
                ))}

                {/* Vertical Scanners */}
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={`v-${i}`}
                        className="absolute w-[1px] h-[20%] bg-gradient-to-b from-transparent via-[var(--glass-highlight)] to-transparent opacity-30 dark:opacity-70"
                        initial={{ top: '-20%', left: `${20 + i * 25}%` }}
                        animate={{ top: '120%' }}
                        transition={{
                            duration: 7 + i,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 2
                        }}
                        style={{
                            boxShadow: '0 0 8px var(--glass-highlight)',
                            filter: 'blur(1px)'
                        }}
                    />
                ))}
            </div>

            {/* 
               LAYER 4: AMBIENT PULSE (Corners)
               Soft green glow in corners to add depth.
               Color adjusted to be visible in light mode too (glass-highlight).
            */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_0_0,_var(--glass-highlight)_0%,transparent_70%)] blur-[100px] opacity-15 dark:opacity-25 mix-blend-screen"
                />
                <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_100%_100%,_var(--glass-highlight)_0%,transparent_70%)] blur-[120px] opacity-15 dark:opacity-25 mix-blend-screen"
                />
            </div>

            {/* 
               LAYER 5: VIGNETTE
               Focuses attention on the center.
            */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80 pointer-events-none" />
        </div>
    )
}
