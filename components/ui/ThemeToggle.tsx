"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="p-2 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 opacity-0">
                <div className="h-5 w-5" />
            </div>
        );
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10 transition-all text-[var(--foreground)] active:scale-95"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ y: -20, opacity: 0, rotate: -180 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 180 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
