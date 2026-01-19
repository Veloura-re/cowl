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
                    scale: [1, 1.4, 1],
                    opacity: [0.15, 0.4, 0.15],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[-10%] lg:top-[-20%] left-[-20%] lg:left-[-15%] w-[120vw] lg:w-[80vw] h-[120vw] lg:h-[80vw] rounded-full blur-[100px] lg:blur-[140px]"
                style={{
                    background: "radial-gradient(circle, var(--primary-green) 0%, transparent 75%)",
                }}
            />

            {/* Top-Right Orb (Highlight Green) - NEW */}
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
                className="absolute top-[-5%] lg:top-[-10%] right-[-20%] lg:right-[-5%] w-[100vw] lg:w-[50vw] h-[100vw] lg:h-[50vw] rounded-full blur-[80px] lg:blur-[100px]"
                style={{
                    background: "radial-gradient(circle, #0ef24e 0%, transparent 70%)",
                }}
            />

            {/* Bottom-Right Orb (Emerald/Highlight) */}
            <motion.div
                animate={{
                    x: [50, -50, 50],
                    y: [30, -60, 30],
                    scale: [1, 1.5, 1],
                    opacity: [0.15, 0.35, 0.15],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute bottom-[-10%] lg:bottom-[-20%] right-[-20%] lg:right-[-15%] w-[140vw] lg:w-[90vw] h-[140vw] lg:h-[90vw] rounded-full blur-[120px] lg:blur-[160px]"
                style={{
                    background: "radial-gradient(circle, var(--glass-highlight) 0%, transparent 75%)",
                }}
            />

            {/* Bottom-Center Orb (Deep Green) - NEW */}
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
                className="absolute bottom-[-5%] lg:bottom-[-10%] left-[10%] lg:left-[20%] w-[100vw] lg:w-[60vw] h-[100vw] lg:h-[60vw] rounded-full blur-[90px] lg:blur-[120px]"
                style={{
                    background: "radial-gradient(circle, #065f46 0%, transparent 70%)",
                }}
            />

            {/* Center Floating Orb (Subtle Green) */}
            <motion.div
                animate={{
                    x: [-60, 60, -60],
                    y: [60, -60, 60],
                    scale: [0.6, 1.2, 0.6],
                    opacity: [0.08, 0.2, 0.08],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[25%] left-[10%] lg:left-[25%] w-[80vw] lg:w-[45vw] h-[80vw] lg:h-[45vw] rounded-full blur-[90px] lg:blur-[110px]"
                style={{
                    background: "radial-gradient(circle, #10b981 0%, transparent 75%)",
                }}
            />

            {/* Global Breathing Glow Overlay (Experimental) */}
            <motion.div
                animate={{
                    opacity: [0, 0.05, 0],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 bg-[var(--primary-green)] mix-blend-screen pointer-events-none"
            />

            {/* 1. Noise Texture Overlay (Top) */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay">
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
