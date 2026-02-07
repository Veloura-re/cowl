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
        <div className="relative flex min-h-screen items-center justify-center p-6 sm:p-4 overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 -z-10 bg-[var(--background)]">
                <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[var(--primary-green)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[var(--primary-green)]/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>

            <div className="glass w-full max-w-sm space-y-6 rounded-[32px] p-8 relative overflow-hidden border border-[var(--foreground)]/10 shadow-2xl animate-in zoom-in duration-500 backdrop-blur-xl bg-white/5">
                <div className="text-center relative">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--foreground)]/5 mb-6 shadow-xl border border-[var(--foreground)]/10 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <BrandLogo size="xl" className="relative z-10 p-2" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--deep-contrast)] uppercase">
                        Welcome Back
                    </h2>
                    <p className="mt-1 text-[15px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.3em]">
                        Access your Claire Network
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[14px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 mb-2 ml-1"
                            >
                                System Identity
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full h-12 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 text-xs font-black text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                placeholder="you@network.com"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-[14px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 mb-2 ml-1"
                            >
                                Secure Key
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full h-12 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 text-xs font-black text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end px-1">
                        <Link
                            href="/login/forgot-password"
                            className="text-[14px] font-black text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors uppercase tracking-[0.1em]"
                        >
                            Recovery Node?
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-rose-500/10 p-3 text-[14px] font-black text-rose-500 border border-rose-500/20 uppercase tracking-widest text-center animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-[var(--primary-green)] px-4 py-4 text-[15px] font-black text-[var(--primary-foreground)] uppercase tracking-[0.3em] hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--primary-green)]/30 mt-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center relative z-10">
                                AUTHORIZE SYSTEM
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-[14px] font-black text-[var(--foreground)]/30 uppercase tracking-widest">
                        New to the network?{' '}
                        <Link
                            href="/register"
                            className="text-[var(--primary-green)] hover:text-[var(--deep-contrast)] transition-colors underline decoration-2 underline-offset-4 decoration-[var(--primary-green)]/20 ml-1"
                        >
                            Request Access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
