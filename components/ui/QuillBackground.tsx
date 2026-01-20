"use client";

import React from "react";
import { motion } from "framer-motion";

export const QuillBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[var(--background)]">
            {/* 3. Grid Pattern (Bottom) */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(to right, var(--primary-green) 1px, transparent 1px),
                              linear-gradient(to bottom, var(--primary-green) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Top-Left Orb (Primary Green) */}
            <motion.div
                animate={{
                    x: [-40, 40, -40],
                    y: [-30, 50, -30],
                    scale: [1, 1.2, 1], // Reduced scale range
                    opacity: [0.15, 0.3, 0.15], // Reduced peak opacity
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[-10%] lg:top-[-20%] left-[-20%] lg:left-[-15%] w-[120vw] lg:w-[80vw] h-[120vw] lg:h-[80vw] rounded-full blur-[60px] lg:blur-[140px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, var(--primary-green) 0%, transparent 75%)",
                }}
            />

            {/* Top-Right Orb (Highlight Green) - Hidden on Mobile */}
            <motion.div
                animate={{
                    x: [20, -20, 20],
                    y: [-10, 40, -10],
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.1, 0.25, 0.1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="hidden lg:block absolute top-[-5%] lg:top-[-10%] right-[-20%] lg:right-[-5%] w-[100vw] lg:w-[50vw] h-[100vw] lg:h-[50vw] rounded-full blur-[80px] lg:blur-[100px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, #0ef24e 0%, transparent 70%)",
                }}
            />

            {/* Bottom-Right Orb (Emerald/Highlight) */}
            <motion.div
                animate={{
                    x: [50, -50, 50],
                    y: [30, -60, 30],
                    scale: [1, 1.3, 1], // Reduced scale range
                    opacity: [0.15, 0.25, 0.15], // Reduced peak opacity
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute bottom-[-10%] lg:bottom-[-20%] right-[-20%] lg:right-[-15%] w-[140vw] lg:w-[90vw] h-[140vw] lg:h-[90vw] rounded-full blur-[70px] lg:blur-[160px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, var(--glass-highlight) 0%, transparent 75%)",
                }}
            />

            {/* Bottom-Center Orb (Deep Green) - Hidden on Mobile */}
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="hidden lg:block absolute bottom-[-5%] lg:bottom-[-10%] left-[10%] lg:left-[20%] w-[100vw] lg:w-[60vw] h-[100vw] lg:h-[60vw] rounded-full blur-[90px] lg:blur-[120px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, #065f46 0%, transparent 70%)",
                }}
            />

            {/* Center Floating Orb (Subtle Green) - Simplified Animation on mobile */}
            <motion.div
                animate={{
                    x: [-30, 30, -30],
                    y: [30, -30, 30],
                    opacity: [0.05, 0.12, 0.05],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[25%] left-[10%] lg:left-[25%] w-[80vw] lg:w-[45vw] h-[80vw] lg:h-[45vw] rounded-full blur-[50px] lg:blur-[110px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, #10b981 0%, transparent 75%)",
                }}
            />

            {/* Global Breathing Glow Overlay - Hidden on Mobile */}
            <motion.div
                animate={{
                    opacity: [0, 0.05, 0],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="hidden lg:block absolute inset-0 bg-[var(--primary-green)] mix-blend-screen pointer-events-none"
            />

            {/* 1. Noise Texture Overlay - Hidden on Mobile */}
            <div className="hidden lg:block absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.7" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>
            </div>
        </div>
    );
};
