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
    const [visibleCount, setVisibleCount] = useState(50)
    const supabase = createClient()

    useEffect(() => {
        const fetchItems = async () => {
            if (!activeBusinessId) {
                setLoading(false)
                return
            }

            setLoading(true)
            const { data, error } = await supabase
                .from('items')
                .select('id, name, stock_quantity, min_stock, unit, selling_price, category') // This line was already explicit, keeping it as is.
                .eq('business_id', activeBusinessId)
                .order('name')

            if (error) {
                console.error('InventoryClientView: Error fetching items', error)
            }
            if (data) {
                setItems(data)
            }
            setLoading(false)
        }
        fetchItems()
    }, [activeBusinessId])

    const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))]

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

    return (
        <div className="space-y-4 animate-in fade-in duration-300 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Inventory</h1>
                        <p className="text-[10px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Stock Management</p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard/inventory/new')}
                        className="flex items-center justify-center rounded-xl bg-[var(--primary-green)] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 border border-[var(--primary-foreground)]/10 group"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-300" />
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
                            className="w-full h-9 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-9 pr-4 text-[10px] font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner placeholder:text-[var(--foreground)]/40"
                        />
                    </div>
                    <button
                        onClick={() => setIsSortPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm"
                    >
                        <SortAsc className="h-3 w-3 opacity-40" />
                        <span>Sort</span>
                    </button>
                    <button
                        onClick={() => setIsFilterPickerOpen(true)}
                        className="h-9 px-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center gap-2 text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider hover:bg-[var(--deep-contrast-hover)] transition-all shadow-sm"
                    >
                        <Filter className="h-3 w-3 opacity-40" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex gap-2">
                <div
                    className="flex-1 glass p-2 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 group hover:bg-[var(--foreground)]/10 transition-all cursor-default"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-600/60">Stock Value</span>
                        </div>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-blue-500/10">ASSETS</span>
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
                        filterLowStock ? "bg-[var(--status-danger)] border-[var(--status-danger-border)]" : "bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10",
                        items.some(i => i.stock_quantity <= i.min_stock) && "critical-glow-red"
                    )}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--status-danger-foreground)]/60">Low Stock</span>
                        </div>
                        <span className="text-[9px] font-black text-[var(--status-danger-foreground)] bg-[var(--status-danger)] px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-[var(--status-danger-border)]">ALERTS</span>
                    </div>
                    <p className="text-xs font-black text-[var(--status-danger-foreground)] mt-1 tabular-nums">
                        {items.filter(i => i.stock_quantity <= i.min_stock).length} <span className="text-[8px] opacity-40 uppercase">Low</span>
                    </p>
                </motion.div>
            </div>

            {/* Grid - Ultra Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {!isContextLoading && filteredItems.slice(0, visibleCount).map((item) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            router.push(`/dashboard/inventory/edit?id=${item.id}`)
                        }}
                        className={clsx(
                            "group relative flex flex-col glass-optimized rounded-[14px] border border-[var(--foreground)]/10 p-2 hover:bg-[var(--foreground)]/10 transition-all duration-300 cursor-pointer overflow-hidden",
                            item.stock_quantity <= item.min_stock && "critical-glow-red"
                        )}
                    >
                        {/* Status Stripe */}
                        <div className={clsx(
                            "absolute top-0 left-0 w-1.5 h-full transition-all duration-300",
                            item.stock_quantity > item.min_stock ? "bg-emerald-500" :
                                item.stock_quantity > 0 ? "bg-amber-500" : "bg-rose-500"
                        )} />
                        {/* Status Indicator Stripe */}
                        <div className={clsx(
                            "absolute top-0 left-0 w-[3px] h-full transition-colors duration-300",
                            item.stock_quantity > item.min_stock ? "bg-emerald-500" : "bg-rose-500"
                        )} />

                        {/* Identity & Status Header */}
                        <div className="flex items-center gap-2">
                            <div className={clsx(
                                "h-8 w-8 rounded-[10px] flex items-center justify-center font-black text-[10px] transition-all duration-300 shadow-inner shrink-0 border uppercase",
                                item.stock_quantity <= item.min_stock
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5"
                                    : "bg-[var(--foreground)]/5 text-[var(--deep-contrast)]/60 border-[var(--foreground)]/10"
                            )}>
                                {item.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-[10px] font-black text-[var(--deep-contrast)] truncate">{item.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0 opacity-40">
                                    <span className="text-[6.5px] font-black uppercase tracking-[0.1em] leading-none shrink-0">STK</span>
                                    <div className="h-0.5 w-0.5 rounded-full bg-current opacity-20" />
                                    <span className="text-[6.5px] font-bold uppercase tracking-widest truncate">{item.category || 'Standard'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metric & Info Bar */}
                        <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.15em]">Price</span>
                                <p className="text-[12px] font-black text-[var(--deep-contrast)] tabular-nums tracking-tighter leading-none">
                                    {formatCurrency(item.selling_price)}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={clsx(
                                    "text-[15px] font-black tabular-nums leading-none tracking-tighter",
                                    item.stock_quantity > item.min_stock ? "text-[var(--status-success-foreground)]" :
                                        item.stock_quantity > 0 ? "text-[var(--status-warning-foreground)]" : "text-[var(--status-danger-foreground)]"
                                )}>
                                    {item.stock_quantity.toLocaleString()} <span className="text-[8px] opacity-40 font-black tracking-widest uppercase">{item.unit}</span>
                                </div>
                                {item.stock_quantity <= item.min_stock && (
                                    <span className="text-[6px] font-black text-rose-500 uppercase tracking-[0.2em] animate-pulse leading-none">
                                        REPLENISH
                                    </span>
                                )}
                            </div>
                        </div>
                    </div >
                ))}
            </div>

            {filteredItems.length > visibleCount && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="px-4 py-2 rounded-xl bg-[var(--foreground)]/5 text-[10px] font-black uppercase tracking-wider hover:bg-[var(--foreground)]/10 transition-all"
                    >
                        Load More ({filteredItems.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            {(loading || isContextLoading) ? (
                <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-300">
                    <LoadingSpinner size="lg" label="Synchronizing Inventory..." />
                    <p className="text-[8px] font-black text-[var(--foreground)]/20 uppercase tracking-[0.3em] mt-2">Checking your secure vault</p>
                </div>
            ) : (!activeBusinessId) ? (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-700">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-wider">No active business</p>
                    <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-50">Please select a business from the sidebar</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-24 opacity-30 animate-in fade-in duration-700">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-wider">No items in this warehouse</p>
                    <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-50">Add a new item to get started</p>
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
