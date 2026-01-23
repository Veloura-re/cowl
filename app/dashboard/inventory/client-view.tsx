'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, ShoppingBag, AlertTriangle, Boxes, Filter, SortAsc, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
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
    const [filterLowStock, setFilterLowStock] = useState(false)
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
            const matchesLowStock = !filterLowStock || item.stock_quantity <= item.min_stock
            return matchesSearch && matchesCategory && matchesLowStock
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
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard/inventory/new')}
                        className="flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-blue-600 transition-all shadow-xl shadow-[var(--deep-contrast)]/20 active:scale-95 border border-white/10 group"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-500" />
                        <span>New Item</span>
                    </motion.button>
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

            {/* Quick Stats Bar */}
            <div className="flex gap-2">
                <div
                    className="flex-1 glass p-2 rounded-xl border border-white/40 group hover:bg-white/60 transition-all cursor-default"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-blue-600/60">Stock Value</span>
                        </div>
                        <span className="text-[7px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-tighter">ASSETS</span>
                    </div>
                    <p className="text-xs font-black text-blue-600 mt-1 tabular-nums">
                        {formatCurrency(items.reduce((sum, i) => sum + (i.stock_quantity * i.selling_price), 0))}
                    </p>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilterLowStock(!filterLowStock)}
                    className={clsx(
                        "flex-1 glass p-2 rounded-xl border transition-all cursor-pointer group",
                        filterLowStock ? "bg-rose-500/10 border-rose-500/50" : "border-white/40 hover:bg-white/60"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-rose-600/60">Low Stock</span>
                        </div>
                        <span className="text-[7px] font-bold text-rose-600 bg-rose-50 px-1 rounded uppercase tracking-tighter">ALERTS</span>
                    </div>
                    <p className="text-xs font-black text-rose-600 mt-1 tabular-nums">
                        {items.filter(i => i.stock_quantity <= i.min_stock).length} <span className="text-[8px] opacity-40 uppercase">Low</span>
                    </p>
                </motion.div>
            </div>

            {/* Grid - Ultra Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {!isContextLoading && filteredItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            router.push(`/dashboard/inventory/edit?id=${item.id}`)
                        }}
                        className="group relative flex flex-col glass rounded-[14px] border border-white/40 p-2 hover:bg-white/60 transition-all duration-500 cursor-pointer overflow-hidden"
                    >
                        {/* Status Stripe */}
                        <div className={clsx(
                            "absolute top-0 left-0 w-1.5 h-full transition-all duration-500",
                            item.stock_quantity > item.min_stock ? "bg-emerald-500" :
                                item.stock_quantity > 0 ? "bg-amber-500" : "bg-rose-500"
                        )} />

                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <Package className={clsx(
                                    "h-2.5 w-2.5 shrink-0",
                                    item.stock_quantity > item.min_stock ? "text-emerald-600" :
                                        item.stock_quantity > 0 ? "text-amber-600" : "text-rose-600"
                                )} />
                                <div className="min-w-0">
                                    <h3 className="text-[11px] font-black text-[var(--deep-contrast)] truncate">{item.name}</h3>
                                    <span className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{item.category || 'Product'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className={clsx(
                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm",
                                    item.stock_quantity > item.min_stock ? "bg-emerald-50/50 text-emerald-700 border-emerald-200" :
                                        item.stock_quantity > 0 ? "bg-amber-50/50 text-amber-700 border-amber-200" :
                                            "bg-rose-50/50 text-rose-700 border-rose-200"
                                )}>
                                    {item.stock_quantity.toLocaleString()} <span className="opacity-40 text-[8px]">{item.unit}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[var(--primary-green)]/10 flex items-center justify-between">
                            <p className="text-[14px] font-black text-[var(--deep-contrast)] tabular-nums">
                                {formatCurrency(item.selling_price)}
                            </p>
                            {item.stock_quantity <= item.min_stock && (
                                <span className={clsx(
                                    "text-[7px] font-black uppercase px-1 rounded border",
                                    item.stock_quantity > 0 ? "text-amber-600 border-amber-200 bg-amber-50" : "text-rose-600 border-rose-200 bg-rose-50"
                                )}>
                                    {item.stock_quantity > 0 ? 'LOW' : 'EMPTY'}
                                </span>
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
