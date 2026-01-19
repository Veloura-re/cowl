'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type InvoiceItem = {
    itemId: string
    name: string
    unit: string
    quantity: number
    rate: number
    tax: number
    amount: number
}

type InvoiceData = {
    partyId: string
    partyName: string
    invoiceNumber: string
    date: string
    items: InvoiceItem[]
    notes: string
}

type InvoiceContextType = {
    data: InvoiceData
    updateData: (updates: Partial<InvoiceData>) => void
    addItem: (item: InvoiceItem) => void
    updateItem: (index: number, updates: Partial<InvoiceItem>) => void
    removeItem: (index: number) => void
    resetData: () => void
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined)

const initialData: InvoiceData = {
    partyId: '',
    partyName: '',
    invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
    date: new Date().toISOString().split('T')[0],
    items: [],
    notes: ''
}

export function InvoiceProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<InvoiceData>(initialData)

    const updateData = (updates: Partial<InvoiceData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }

    const addItem = (item: InvoiceItem) => {
        setData(prev => ({ ...prev, items: [...prev.items, item] }))
    }

    const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
        setData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item)
        }))
    }

    const removeItem = (index: number) => {
        setData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }))
    }

    const resetData = () => {
        setData({ ...initialData, invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000) })
    }

    return (
        <InvoiceContext.Provider value={{ data, updateData, addItem, updateItem, removeItem, resetData }}>
            {children}
        </InvoiceContext.Provider>
    )
}

export function useInvoice() {
    const context = useContext(InvoiceContext)
    if (!context) {
        throw new Error('useInvoice must be used within InvoiceProvider')
    }
    return context
}
