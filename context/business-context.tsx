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
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

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
    const supabase = createClient()
    const router = useRouter()

    const fetchBusinesses = async () => {
        setIsLoading(true)
        console.log('BusinessContext: Fetching session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            console.error('BusinessContext: Session error', sessionError)
        }

        if (!session) {
            console.warn('BusinessContext: No session found, redirecting to login')
            // Only redirect if absolutely sure and on a dashboard route
            if (window.location.pathname.startsWith('/dashboard')) {
                router.replace('/login')
            }
            setIsLoading(false)
            return
        }

        console.log('BusinessContext: Session confirmed for', session.user.email)
        const { data, error } = await supabase
            .from('businesses')
            .select('id, name, currency, owner_id')
            .order('name')

        if (error) {
            console.error('BusinessContext: Error fetching businesses', error)
        }

        if (data) {
            const formattedBusinesses = data.map(b => ({
                ...b,
                isOwner: b.owner_id === session.user.id
            }))
            setBusinesses(formattedBusinesses)

            // If user has no businesses, redirect to onboarding
            if (data.length === 0 && window.location.pathname !== '/onboarding') {
                console.log('BusinessContext: No businesses found, redirecting to onboarding')
                router.replace('/onboarding')
                setIsLoading(false)
                return
            }

            // Restore from localStorage if possible
            const savedId = localStorage.getItem('activeBusinessId')
            if (savedId && data.find(b => b.id === savedId)) {
                setActiveBusinessIdState(savedId)
                console.log('BusinessContext: Restored active business', savedId)
            } else if (data.length > 0) {
                setActiveBusinessIdState(data[0].id)
                console.log('BusinessContext: Set default active business', data[0].id)
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        // Init businesses
        fetchBusinesses()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('BusinessContext: Auth Event:', event)
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchBusinesses()
            } else if (event === 'SIGNED_OUT') {
                setBusinesses([])
                setActiveBusinessIdState(null)
                if (window.location.pathname.startsWith('/dashboard')) {
                    router.replace('/login')
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const setActiveBusinessId = (id: string) => {
        setActiveBusinessIdState(id)
        localStorage.setItem('activeBusinessId', id)
    }

    const activeBusiness = businesses.find(b => b.id === activeBusinessId)
    const activeCurrencySymbol = currencies.find(c => c.code === activeBusiness?.currency)?.symbol || '$'

    const formatCurrency = (amount: number) => {
        return `${activeCurrencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <BusinessContext.Provider value={{
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
            showSuccess: (message: string, title?: string) => setFeedback({ isOpen: true, message, title, variant: 'success' }),
            showError: (message: string, title?: string) => setFeedback({ isOpen: true, message, title, variant: 'error' })
        }}>
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
