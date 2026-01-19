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
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const fetchBusinesses = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            setIsLoading(false)
            return
        }

        if (user) {
            const { data } = await supabase
                .from('businesses')
                .select('id, name, currency, owner_id')
                .order('name')

            if (data) {
                const formattedBusinesses = data.map(b => ({
                    ...b,
                    isOwner: b.owner_id === user.id
                }))
                setBusinesses(formattedBusinesses)
                // Restore from localStorage if possible
                const savedId = localStorage.getItem('activeBusinessId')
                if (savedId && data.find(b => b.id === savedId)) {
                    setActiveBusinessIdState(savedId)
                } else if (data.length > 0) {
                    setActiveBusinessIdState(data[0].id)
                }
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchBusinesses()
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
            formatCurrency
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
