'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Loader2, ArrowRight, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login/reset-password`,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSubmitted(true)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-4">
            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-6 relative overflow-hidden border border-white/40 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-green)]/10 mb-4 shadow-inner">
                        <Mail className="h-6 w-6 text-[var(--primary-green)]" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--deep-contrast)] uppercase">
                        Reset Password
                    </h2>
                    <p className="mt-1 text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider leading-relaxed">
                        We'll send a recovery link to your email
                    </p>
                </div>

                {!submitted ? (
                    <form className="space-y-4" onSubmit={handleReset}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1"
                            >
                                Registered Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full h-11 rounded-xl border border-white/20 bg-white/50 px-4 text-xs font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-green)] transition-all shadow-inner"
                                placeholder="you@company.com"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-2.5 text-[10px] font-bold text-red-600 border border-red-100 uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="group relative flex w-full justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-3 text-[10px] font-bold text-white uppercase tracking-wider hover:bg-[var(--primary-green)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--deep-contrast)]/20"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    SEND RECOVERY LINK
                                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4 py-4 text-center">
                        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider leading-loose">
                                Recovery email sent!<br />Check your inbox for instructions.
                            </p>
                        </div>
                    </div>
                )}

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-[9px] font-bold text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] transition-colors uppercase tracking-wider"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
