'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, ShoppingBag, AlertTriangle, Boxes, Filter, SortAsc, ChevronDown } from 'lucide-react'
import PickerModal from '@/components/ui/PickerModal'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import { useRouter } from 'next/navigation'

export default function InventoryClientView({ initialItems }: { initialItems?: any[] }) {
    const router = useRouter()
    const { activeBusinessId, formatCurrency, isLoading: isContextLoading } = useBusiness()
    const [items, setItems] = useState<any[]>(initialItems || [])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('name-asc')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [isSortPickerOpen, setIsSortPickerOpen] = useState(false)
    const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false)
    const [loading, setLoading] = useState(!initialItems)
    const supabase = createClient()

    useEffect(() => {
        const fetchItems = async () => {
            if (!activeBusinessId) {
                console.log('InventoryClientView: No active business, skipping fetch')
                setLoading(false)
                return
            }

            setLoading(true)
            console.log('InventoryClientView: Fetching fresh items for business:', activeBusinessId)
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('business_id', activeBusinessId)
                .order('name')

            if (error) {
                console.error('InventoryClientView: Error fetching items', error)
            }
            if (data) {
                console.log('InventoryClientView: Fetched', data.length, 'items')
                setItems(data)
            }
            setLoading(false)
        }
        fetchItems()
    }, [activeBusinessId]) // Re-fetch if business changes
    // Derived Categories
    const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))]

    // Items are already filtered by business_id at the database level
    const filteredItems = items
        .filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
            if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
            if (sortBy === 'price-low') return Number(a.selling_price) - Number(b.selling_price)
            if (sortBy === 'price-high') return Number(b.selling_price) - Number(a.selling_price)
            if (sortBy === 'stock-low') return Number(a.stock_quantity) - Number(b.stock_quantity)
            if (sortBy === 'stock-high') return Number(b.stock_quantity) - Number(a.stock_quantity)
            return 0
        })

    const fetchItems = () => {
        window.location.reload();
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Inventory</h1>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Stock Management</p>
                    </div>
                    <Link
                        href="/dashboard/inventory/new"
                        className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        New Item
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/40" />
                        <input
                            type="text"
                            placeholder="Search stock..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 rounded-xl bg-white/50 border border-white/20 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/20"
                        />
                    </div>
                    <button
                        onClick={() => setIsSortPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                    >
                        <SortAsc className="h-3 w-3 opacity-40" />
                        <span>Sort</span>
                    </button>
                    <button
                        onClick={() => setIsFilterPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-white/50 border border-white/20 flex items-center gap-2 text-[9px] font-bold text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-white/10 transition-all shadow-sm"
                    >
                        <Filter className="h-3 w-3 opacity-40" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Grid - Ultra Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {!isContextLoading && filteredItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            router.push(`/dashboard/inventory/edit?id=${item.id}`)
                        }}
                        className="glass p-2.5 rounded-xl group hover:bg-white/60 transition-all duration-300 border border-white/40 cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className={clsx(
                                    "h-7 w-7 rounded-lg flex items-center justify-center shadow-inner transition-transform group-hover:rotate-3",
                                    item.stock_quantity > item.min_stock ? "bg-emerald-100 text-emerald-600" :
                                        item.stock_quantity > 0 ? "bg-amber-100 text-amber-600" :
                                            "bg-rose-100 text-rose-600"
                                )}>
                                    <Package className="h-3.5 w-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[10px] font-bold text-[var(--deep-contrast)] leading-tight">{item.name}</h3>
                                        {item.category && (
                                            <span className="text-[6px] font-bold uppercase tracking-wider bg-[var(--primary-green)]/10 text-[var(--primary-green)] px-1 py-0.5 rounded border border-[var(--primary-green)]/10">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-40">
                                        <Boxes className="h-2 w-2" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">{item.unit || 'Units'}</span>
                                        {item.sku && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <span className="text-[6px] font-bold tracking-wider bg-black/5 px-1 rounded">#{item.sku}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={clsx(
                                "text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                                item.stock_quantity > item.min_stock ? "bg-emerald-100/50 text-emerald-700 border-emerald-200" :
                                    item.stock_quantity > 0 ? "bg-amber-100/50 text-amber-700 border-amber-200" :
                                        "bg-rose-100/50 text-red-700 border-rose-200"
                            )}>
                                {item.stock_quantity.toLocaleString()} <span className="opacity-40">{item.unit}</span>
                            </span>
                        </div>

                        {item.description && (
                            <p className="text-[9px] font-medium text-[var(--foreground)]/50 line-clamp-2 mt-1 px-1 border-l border-[var(--primary-green)]/10">
                                {item.description}
                            </p>
                        )}

                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-[var(--foreground)]/30">
                                <span>Stock Level</span>
                                <span className={clsx(
                                    item.stock_quantity <= item.min_stock ? "text-amber-600" : "text-[var(--foreground)]/30"
                                )}>
                                    {Math.round((item.stock_quantity / (item.min_stock * 3 || 100)) * 100)}%
                                </span>
                            </div>
                            <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden border border-white/20">
                                <div
                                    className={clsx(
                                        "h-full transition-all duration-1000 ease-out rounded-full",
                                        item.stock_quantity > item.min_stock ? "bg-emerald-500" :
                                            item.stock_quantity > 0 ? "bg-amber-500 animate-pulse" :
                                                "bg-rose-500"
                                    )}
                                    style={{ width: `${Math.min(100, (item.stock_quantity / (item.min_stock * 3 || 100)) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-[var(--primary-green)]/5">
                            <div>
                                <p className="text-[8px] font-bold text-[var(--foreground)]/30 uppercase tracking-wider leading-none mb-1">Selling Rate</p>
                                <p className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight">{formatCurrency(item.selling_price)}</p>
                            </div>
                            {item.stock_quantity <= item.min_stock && (
                                <div className={clsx(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-bold uppercase tracking-wider",
                                    item.stock_quantity > 0 ? "bg-amber-100/50 text-amber-600 border-amber-200 animate-pulse" : "bg-rose-100/50 text-rose-600 border-rose-200"
                                )}>
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>{item.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {(loading || isContextLoading) ? (
                <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-500">
                    <LoadingSpinner size="lg" label="Synchronizing Inventory..." />
                    <p className="text-[8px] font-bold text-[var(--foreground)]/20 uppercase tracking-widest mt-2">Checking your secure vault</p>
                </div>
            ) : (!activeBusinessId) ? (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-700">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No active business</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Please select a business from the sidebar</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-700">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No items in this warehouse</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Add a new item to get started</p>
                </div>
            ) : null}


            <PickerModal
                isOpen={isSortPickerOpen}
                onClose={() => setIsSortPickerOpen(false)}
                onSelect={(val) => {
                    setSortBy(val)
                    setIsSortPickerOpen(false)
                }}
                title="Sort Inventory"
                showSearch={false}
                options={[
                    { id: 'name-asc', label: 'NAME (A-Z)' },
                    { id: 'name-desc', label: 'NAME (Z-A)' },
                    { id: 'price-low', label: 'PRICE (LOW TO HIGH)' },
                    { id: 'price-high', label: 'PRICE (HIGH TO LOW)' },
                    { id: 'stock-low', label: 'STOCK (LOW TO HIGH)' },
                    { id: 'stock-high', label: 'STOCK (HIGH TO LOW)' },
                ]}
                selectedValue={sortBy}
            />

            <PickerModal
                isOpen={isFilterPickerOpen}
                onClose={() => setIsFilterPickerOpen(false)}
                onSelect={(val) => {
                    setFilterCategory(val)
                    setIsFilterPickerOpen(false)
                }}
                title="Filter by Category"
                showSearch={false}
                options={categories.map(cat => ({
                    id: cat,
                    label: cat.toUpperCase()
                }))}
                selectedValue={filterCategory}
            />
        </div>
    )
}
