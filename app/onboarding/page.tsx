'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, MapPin, Phone, DollarSign } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { currencies } from '@/lib/currencies'
import PickerModal from '@/components/ui/PickerModal'

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        currency: 'USD'
    })

    // Verify authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.replace('/login')
            }
            setChecking(false)
        }
        checkAuth()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Get fresh session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                throw new Error('Session expired. Please log in again.')
            }

            const { data, error: businessError } = await supabase
                .from('businesses')
                .insert({
                    name: formData.name,
                    address: formData.address || null,
                    phone: formData.phone || null,
                    currency: formData.currency,
                    owner_id: session.user.id
                })
                .select()
                .single()

            if (businessError) {
                console.error('Business creation error:', businessError)
                throw new Error(businessError.message || 'Failed to create business')
            }

            console.log('Business created successfully:', data)

            // Redirect to dashboard
            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            console.error('Onboarding error:', err)
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-green)]" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-4">
            <div className="glass w-full max-w-2xl space-y-6 rounded-[32px] p-8 relative overflow-hidden border border-white/40 dark:border-white/10 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/40 dark:bg-white/5 mb-4 shadow-xl border border-white/40 dark:border-white/10">
                        <BrandLogo size="lg" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--deep-contrast)] uppercase">
                        Welcome to LUCY-ex
                    </h2>
                    <p className="mt-2 text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
                        Let's set up your first business
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Business Name */}
                        <div>
                            <label
                                htmlFor="businessName"
                                className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2 ml-1"
                            >
                                <Building2 className="inline h-3 w-3 mr-1" />
                                Business Name *
                            </label>
                            <input
                                id="businessName"
                                name="businessName"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="block w-full h-12 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 text-sm font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 transition-all shadow-inner"
                                placeholder="e.g., Acme Corporation"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label
                                htmlFor="address"
                                className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2 ml-1"
                            >
                                <MapPin className="inline h-3 w-3 mr-1" />
                                Business Address
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="block w-full h-12 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 text-sm font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 transition-all shadow-inner"
                                placeholder="123 Main Street, City, Country"
                            />
                        </div>

                        {/* Phone & Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2 ml-1"
                                >
                                    <Phone className="inline h-3 w-3 mr-1" />
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="block w-full h-12 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 text-sm font-bold text-[var(--deep-contrast)] placeholder-[var(--foreground)]/20 focus:border-[var(--primary-green)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 transition-all shadow-inner"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="currency"
                                    className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2 ml-1"
                                >
                                    <DollarSign className="inline h-3 w-3 mr-1" />
                                    Currency *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCurrencyPickerOpen(true)}
                                    className="w-full h-12 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 text-sm font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all shadow-inner text-left flex items-center justify-between"
                                >
                                    <span>{currencies.find(c => c.code === formData.currency)?.name || 'Select Currency'}</span>
                                    <span className="text-[var(--foreground)]/40">{currencies.find(c => c.code === formData.currency)?.symbol}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !formData.name}
                        className="group relative flex w-full justify-center rounded-xl bg-[var(--deep-contrast)] px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[var(--primary-green)] active:scale-95 disabled:opacity-70 transition-all duration-300 shadow-xl shadow-[var(--deep-contrast)]/20"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span>Create Business & Continue</span>
                        )}
                    </button>

                    <p className="text-center text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">
                        You can add more businesses later from the dashboard
                    </p>
                </form>
            </div>

            <PickerModal
                isOpen={isCurrencyPickerOpen}
                onClose={() => setIsCurrencyPickerOpen(false)}
                onSelect={(code) => setFormData({ ...formData, currency: code })}
                title="Select Currency"
                options={currencies.map(c => ({
                    id: c.code,
                    label: c.name,
                    subLabel: `${c.symbol} - ${c.code}`
                }))}
                selectedValue={formData.currency}
            />
        </div>
    )
}
