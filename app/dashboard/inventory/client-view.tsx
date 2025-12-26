'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import CreateItemModal from './create-item-modal'

export default function InventoryClientView({ initialItems }: { initialItems: any[] }) {
    const [items, setItems] = useState(initialItems)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Inventory</h1>
                    <p className="mt-1 text-[var(--text-secondary)]">
                        Track goods and services
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-highlight)]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg bg-[var(--background)] py-2 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] border border-transparent focus:border-[var(--primary)]"
                    />
                </div>
            </div>

            {/* List */}
            <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--surface-highlight)]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Name & SKU</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Selling Price</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Purchase Price</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-center">Current Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-highlight)]">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="group hover:bg-[var(--surface-highlight)]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-[var(--surface-highlight)] flex items-center justify-center text-[var(--primary)]">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[var(--text-main)]">{item.name}</div>
                                                    {item.sku && <div className="text-xs text-[var(--text-secondary)]">{item.sku}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[var(--text-main)] font-medium">
                                            {item.selling_price}
                                        </td>
                                        <td className="px-6 py-4 text-right text-[var(--text-secondary)]">
                                            {item.purchase_price}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={
                                                "px-2 py-1 rounded text-xs font-semibold " +
                                                (item.stock_quantity <= item.min_stock
                                                    ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
                                                    : "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]")
                                            }>
                                                {item.stock_quantity} {item.unit}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
