'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { currencies } from '@/lib/currencies'
import { useRouter } from 'next/navigation'

type Business = {
    id: string
    name: string
    currency: string
    isOwner: boolean
    logo_url?: string
}

type BusinessContextType = {
    businesses: Business[]
    activeBusinessId: string | null
    setActiveBusinessId: (id: string) => void
    refreshBusinesses: () => Promise<void>
    isLoading: boolean
    activeCurrencySymbol: string
    formatCurrency: (amount: number) => string
    isGlobalLoading: boolean
    setIsGlobalLoading: (loading: boolean) => void
    feedback: { isOpen: boolean, message: string, variant: 'success' | 'error', title?: string }
    setFeedback: (f: { isOpen: boolean, message: string, variant: 'success' | 'error', title?: string }) => void
    showSuccess: (message: string, title?: string) => void
    showError: (message: string, title?: string) => void
    isDockHidden: boolean
    setIsDockHidden: (hidden: boolean) => void
}

export const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGlobalLoading, setIsGlobalLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ isOpen: boolean, message: string, variant: 'success' | 'error', title?: string }>({
        isOpen: false,
        message: '',
        variant: 'success'
    })
    const [isDockHidden, setIsDockHidden] = useState(false)
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    const fetchBusinesses = async (silent = false) => {
        if (!silent) setIsLoading(true)
        console.log('BusinessContext: Fetching session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            console.error('BusinessContext: Session error', sessionError)
        }

        if (!session) {
            console.warn('BusinessContext: No session found, redirecting to login')
            const path = window.location.pathname
            if (path.startsWith('/dashboard') || path === '/onboarding') {
                router.replace('/login')
            }
            if (!silent) setIsLoading(false)
            return
        }

        setUser(session.user)

        // If session exists but on login/register -> dashboard
        const path = window.location.pathname
        if (path === '/login' || path === '/register') {
            router.replace('/dashboard')
            if (!silent) setIsLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('businesses')
            .select('id, name, currency, owner_id, logo_url')
            .order('name')

        if (error) {
            console.error('BusinessContext: Error fetching businesses', error)
        }

        if (data) {
            const formattedBusinesses = data.map(b => ({
                ...b,
                isOwner: b.owner_id === session.user.id
            }))

            setBusinesses(prev => {
                const isSame = JSON.stringify(prev) === JSON.stringify(formattedBusinesses)
                return isSame ? prev : formattedBusinesses
            })

            // Ghost business protection: if active business no longer exists, reset it
            const currentActiveId = activeBusinessId || localStorage.getItem('activeBusinessId')
            const stillExists = data.some(b => b.id === currentActiveId)

            if (currentActiveId && !stillExists) {
                console.log('BusinessContext: Active business no longer exists, resetting...')
                const nextId = data.length > 0 ? data[0].id : null
                setActiveBusinessIdState(nextId)
                if (nextId) localStorage.setItem('activeBusinessId', nextId)
                else localStorage.removeItem('activeBusinessId')
            } else if (data.length > 0 && !activeBusinessId) {
                // Set initial default
                const defaultId = currentActiveId && stillExists ? currentActiveId : data[0].id
                setActiveBusinessIdState(defaultId)
                localStorage.setItem('activeBusinessId', defaultId)
            }

            if (data.length === 0 && window.location.pathname !== '/onboarding') {
                router.replace('/onboarding')
                if (!silent) setIsLoading(false)
                return
            }
        }
        if (!silent) setIsLoading(false)
    }

    useEffect(() => {
        fetchBusinesses()

        const handleFocus = () => fetchBusinesses(true)
        window.addEventListener('focus', handleFocus)

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('BusinessContext: Auth Event:', event)
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    setUser(session.user)
                    fetchBusinesses(true)
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setBusinesses([])
                setActiveBusinessIdState(null)
                localStorage.removeItem('activeBusinessId')
                if (window.location.pathname.startsWith('/dashboard')) {
                    router.replace('/login')
                }
            }
        })

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    useEffect(() => {
        if (!user) return

        console.log('BusinessContext: Setting up real-time channels for user:', user.email)

        // Channel for all businesses (global changes)
        const businessesChannel = supabase
            .channel('public:businesses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, (payload) => {
                console.log('BusinessContext: Business table pulse:', payload.eventType)
                // Small delay to let DB triggers settle
                setTimeout(() => fetchBusinesses(true), 500)
            })
            .subscribe((status) => {
                if (status !== 'SUBSCRIBED') console.warn('BusinessContext: Businesses sync state:', status)
            })

        // Channel for this specific user's memberships
        const membersChannel = supabase
            .channel(`public:business_members:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'business_members',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('BusinessContext: Membership pulse:', payload.eventType)
                // Small delay to let RLS & Triggers settle
                setTimeout(() => fetchBusinesses(true), 500)
            })
            .subscribe((status) => {
                if (status !== 'SUBSCRIBED') console.warn('BusinessContext: Membership sync state:', status)
            })

        return () => {
            console.log('BusinessContext: Cleaning up real-time channels for user:', user.email)
            supabase.removeChannel(businessesChannel)
            supabase.removeChannel(membersChannel)
        }
    }, [user?.id])

    const setActiveBusinessId = React.useCallback((id: string) => {
        setActiveBusinessIdState(id)
        localStorage.setItem('activeBusinessId', id)
    }, [])

    const activeBusiness = React.useMemo(() => businesses.find(b => b.id === activeBusinessId), [businesses, activeBusinessId])
    const activeCurrencySymbol = React.useMemo(() => currencies.find(c => c.code === activeBusiness?.currency)?.symbol || '$', [activeBusiness])

    const formatCurrency = React.useCallback((amount: number) => {
        return `${activeCurrencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }, [activeCurrencySymbol])

    const showSuccess = React.useCallback((message: string, title?: string) => setFeedback({ isOpen: true, message, title, variant: 'success' }), [])
    const showError = React.useCallback((message: string, title?: string) => setFeedback({ isOpen: true, message, title, variant: 'error' }), [])

    const contextValue = React.useMemo(() => ({
        businesses,
        activeBusinessId,
        setActiveBusinessId,
        refreshBusinesses: fetchBusinesses,
        isLoading,
        activeCurrencySymbol,
        formatCurrency,
        isGlobalLoading,
        setIsGlobalLoading,
        feedback,
        setFeedback,
        showSuccess,
        showError,
        isDockHidden,
        setIsDockHidden
    }), [
        businesses,
        activeBusinessId,
        setActiveBusinessId,
        isLoading,
        activeCurrencySymbol,
        formatCurrency,
        isGlobalLoading,
        feedback,
        showSuccess,
        showError,
        isDockHidden,
        setIsDockHidden
    ])

    return (
        <BusinessContext.Provider value={contextValue}>
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    const context = useContext(BusinessContext)
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider')
    }
    return context
}
