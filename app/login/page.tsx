'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowRight, Lock } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-4">
            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-6 relative overflow-hidden border border-white/40 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-green)]/10 mb-4 shadow-inner">
                        <Lock className="h-6 w-6 text-[var(--primary-green)]" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--deep-contrast)] uppercase">
                        Welcome Back
                    </h2>
                    <p className="mt-1 text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-widest">
                        Access your business OS
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-3">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/60 mb-1.5 ml-1"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full h-10 rounded-xl border border-white/20 bg-white/50 px-4 text-xs font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-green)] transition-all shadow-inner"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/60 mb-1.5 ml-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full h-10 rounded-xl border border-white/20 bg-white/50 px-4 text-xs font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-green)] transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            href="/login/forgot-password"
                            className="text-[9px] font-bold text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors uppercase tracking-widest"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-2.5 text-[10px] font-bold text-red-600 border border-red-100 uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-3 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-[var(--primary-green)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--deep-contrast)]/20"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                SIGN IN
                                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-widest">
                        Don't have an account?{' '}
                        <Link
                            href="/register"
                            className="text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors underline decoration-2 underline-offset-4 decoration-[var(--primary-green)]/30"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
