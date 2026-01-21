'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const supabase = createClient()
    const [currentPassword, setCurrentPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (!currentPassword) {
            setError("Current password is required")
            return
        }

        if (password !== confirmPassword) {
            setError("New passwords don't match")
            return
        }

        if (password.length < 6) {
            setError("New password must be at least 6 characters")
            return
        }

        setLoading(true)
        try {
            // 1. Verify Current Password
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !user.email) throw new Error("User not found")

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            })

            if (signInError) throw new Error("Incorrect current password")

            // 2. Update to New Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) throw updateError

            setSuccess(true)
            setCurrentPassword('')
            setPassword('')
            setConfirmPassword('')
            setTimeout(() => {
                onClose()
                setSuccess(false)
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                    >
                        <div className="glass rounded-2xl border border-white/20 shadow-2xl overflow-hidden m-4">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--deep-contrast)]">Change Password</h2>
                                        <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">Secure your account</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/10 text-[var(--foreground)]/50 hover:text-[var(--deep-contrast)] transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Password updated successfully!
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 ml-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-sm font-semibold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 ml-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-sm font-semibold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 ml-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-white/50 border border-white/20 px-4 text-sm font-semibold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || success}
                                        className={clsx(
                                            "w-full h-11 rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                                            success
                                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                                : "bg-[var(--deep-contrast)] text-white hover:bg-[var(--primary-green)] shadow-[var(--deep-contrast)]/10"
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : success ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Updated
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
