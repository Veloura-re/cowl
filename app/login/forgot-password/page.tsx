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

        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/login/reset-password`,
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
            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-8 relative overflow-hidden border border-[var(--foreground)]/10 shadow-xl animate-in zoom-in duration-500 backdrop-blur-xl bg-white/5">
                <div className="text-center relative">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/5 mb-6 shadow-lg border border-[var(--foreground)]/10 relative group overflow-hidden">
                        <Mail className="h-7 w-7 text-[var(--primary-green)] relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--deep-contrast)] uppercase">
                        Reset Password
                    </h2>
                    <p className="mt-1 text-[15px] font-medium text-[var(--foreground)]/40 uppercase tracking-widest leading-relaxed">
                        We'll send a recovery link to your email
                    </p>
                </div>

                {!submitted ? (
                    <form className="space-y-5" onSubmit={handleReset}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[14px] font-medium uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1"
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
                                className="block w-full h-12 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 text-xs font-medium text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                placeholder="you@company.com"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-rose-500/10 p-3 text-[14px] font-medium text-rose-500 border border-rose-500/20 uppercase tracking-widest text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="group relative flex w-full justify-center rounded-xl bg-[var(--primary-green)] px-4 py-3 text-[15px] font-bold text-[var(--primary-foreground)] uppercase tracking-widest hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-lg shadow-[var(--primary-green)]/20 mt-4 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center relative z-10">
                                    Send Link
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4 py-4 text-center">
                        <div className="rounded-2xl bg-[var(--primary-green)]/5 p-6 border border-[var(--primary-green)]/20">
                            <p className="text-[14px] font-bold text-[var(--primary-green)] uppercase tracking-widest leading-loose">
                                Recovery email sent!<br />Check your inbox for instructions.
                            </p>
                        </div>
                    </div>
                )}

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-[14px] font-bold text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
