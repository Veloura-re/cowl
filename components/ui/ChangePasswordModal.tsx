'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Lock, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react'
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
            setError("Active key required")
            return
        }

        if (password !== confirmPassword) {
            setError("New key mismatch")
            return
        }

        if (password.length < 6) {
            setError("Target key too short (Min 6 chars)")
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !user.email) throw new Error("Terminal access denied")

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            })

            if (signInError) throw new Error("Current authorization failed")

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
            }, 1500)
        } catch (err: any) {
            setError(err.message || 'Authorization error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[var(--modal-backdrop)] backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-[var(--foreground)]/10"
                    >
                        <div className="px-6 py-4 border-b border-[var(--foreground)]/10 flex items-center justify-between bg-[var(--foreground)]/5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/20">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Access Control</h2>
                                    <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Crypto Cycle Update</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-500/10 text-[var(--foreground)]/30 hover:text-rose-500 transition-all active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    SECURED
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1 block">
                                        Active Terminal Key
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/10"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1 block">
                                        Target Access Key
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/10"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1 block">
                                        Verify Target Key
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[13px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className={clsx(
                                        "w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2",
                                        success
                                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                            : "bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] hover:bg-[var(--deep-contrast-hover)] shadow-[var(--deep-contrast)]/20"
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            SYNCING...
                                        </>
                                    ) : success ? (
                                        'COMPLETED'
                                    ) : (
                                        'OVERRIDE SECURE KEY'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
