'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/dashboard')
            }
        }
        checkSession()
    }, [router, supabase])

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
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-4 bg-[var(--background)]">
            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-6 relative overflow-hidden border border-[var(--foreground)]/10 shadow-2xl animate-in zoom-in duration-500">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/5 mb-4 shadow-xl border border-[var(--foreground)]/10">
                        <BrandLogo size="lg" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--deep-contrast)] uppercase">
                        Welcome Back
                    </h2>
                    <p className="mt-1 text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em]">
                        Access your LUCY-ex OS
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1"
                            >
                                System Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full h-11 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 text-xs font-black text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1"
                            >
                                Secure Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full h-11 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 text-xs font-black text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end px-1">
                        <Link
                            href="/login/forgot-password"
                            className="text-[9px] font-black text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors uppercase tracking-[0.15em]"
                        >
                            Recovery Key?
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-rose-500/10 p-2.5 text-[10px] font-black text-rose-500 border border-rose-500/20 uppercase tracking-widest text-center animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-[var(--primary-green)] px-4 py-3.5 text-[10px] font-black text-[var(--primary-foreground)] uppercase tracking-[0.2em] hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--primary-green)]/20 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                AUTHORIZE
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-[10px] font-black text-[var(--foreground)]/30 uppercase tracking-widest">
                        New to the network?{' '}
                        <Link
                            href="/register"
                            className="text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors underline decoration-2 underline-offset-4 decoration-[var(--primary-green)]/20"
                        >
                            Request Access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
