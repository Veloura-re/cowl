'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Ensure user is authenticated (via the callback session)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.replace('/login')
            }
        }
        checkSession()
    }, [router, supabase.auth])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-8 text-center border border-white/40 shadow-2xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 mb-4 animate-in zoom-in">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight uppercase">
                        Password Updated
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider leading-relaxed">
                        Your security is our priority. Redirecting to dashboard...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-4">
            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-6 relative overflow-hidden border border-white/40 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-green)]/10 mb-4 shadow-inner">
                        <Lock className="h-6 w-6 text-[var(--primary-green)]" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--deep-contrast)] uppercase">
                        New Password
                    </h2>
                    <p className="mt-1 text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
                        Set a strong new password
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1">
                                New Password
                            </label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full h-11 rounded-xl border border-white/20 bg-white/50 px-4 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-green)] transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1">
                                Confirm New Password
                            </label>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full h-11 rounded-xl border border-white/20 bg-white/50 px-4 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-green)] transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-2.5 text-[10px] font-bold text-red-600 border border-red-100 uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-3 text-[10px] font-bold text-white uppercase tracking-wider hover:bg-[var(--primary-green)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--deep-contrast)]/20"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                UPDATE PASSWORD
                                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
