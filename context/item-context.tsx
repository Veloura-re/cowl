'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ItemData = {
    name: string
    sku: string
    type: 'PRODUCT' | 'SERVICE'
    category: string
    description: string
    unit: string
    selling_price: number
    purchase_price: number
    stock_quantity: number
    min_stock: number
}

type ItemContextType = {
    data: ItemData
    updateData: (updates: Partial<ItemData>) => void
    resetData: () => void
}

const ItemContext = createContext<ItemContextType | undefined>(undefined)

const initialData: ItemData = {
    name: '',
    sku: '',
    type: 'PRODUCT',
    category: '',
    description: '',
    unit: 'PCS',
    selling_price: 0,
    purchase_price: 0,
    stock_quantity: 0,
    min_stock: 0
}

export function ItemProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<ItemData>(initialData)

    const updateData = (updates: Partial<ItemData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }

    const resetData = () => {
        setData(initialData)
    }

    return (
        <ItemContext.Provider value={{ data, updateData, resetData }}>
            {children}
        </ItemContext.Provider>
    )
}

export function useItem() {
    const context = useContext(ItemContext)
    if (!context) {
        throw new Error('useItem must be used within ItemProvider')
    }
    return context
}
