'use client'

import { useEffect, useState } from 'react'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import { BarChart3, TrendingUp, Wallet, Package, ArrowRight, Plus, AlertCircle, Clock, FileText, ShoppingCart, Users, Activity, CreditCard, Globe, ArrowUpRight, ArrowDownRight, BadgeCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Link from 'next/link'
import { format } from 'date-fns'

export default function DashboardPage() {
    const { activeBusinessId, formatCurrency } = useBusiness()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPurchases: 0,
        netProfit: 0,
        pendingPayments: 0,
        lowStockCount: 0,
        recentActivity: [] as any[],
        topItems: [] as any[],
        cashBalance: 0,
        bankBalance: 0,
        onlineBalance: 0,
        totalReceivables: 0,
        totalPayables: 0
    })

    const fetchDashboardData = async () => {
        console.log('DEBUG: Fetching dashboard data for business:', activeBusinessId)
        if (!activeBusinessId) return

        try {
            // 1. Invoices (Sales & Purchases)
            const { data: invoices } = await supabase
                .from('invoices')
                .select('id, invoice_number, total_amount, type, status, date, created_at, party_id') // Corrected column name
                .eq('business_id', activeBusinessId)
                .order('created_at', { ascending: false })
            console.log('DEBUG: Fetched invoices:', invoices?.length, invoices)

            // 2. Inventory Items
            const { data: items } = await supabase
                .from('items')
                .select('id, name, stock_quantity')
                .eq('business_id', activeBusinessId)
            console.log('DEBUG: Fetched items:', items?.length)

            // 3. Transactions (Finance)
            const { data: transactions } = await supabase
                .from('transactions')
                .select('id, amount, type, mode, date, created_at, description, party:parties(name)')
                .eq('business_id', activeBusinessId)
                .order('date', { ascending: false })
            console.log('DEBUG: Fetched transactions:', transactions?.length)

            // 4. Parties
            const { data: parties } = await supabase
                .from('parties')
                .select('id, name, type, opening_balance') // Added id and name
                .eq('business_id', activeBusinessId)
            console.log('DEBUG: Fetched parties:', parties?.length)

            let sales = 0
            let purchases = 0
            let pending = 0
            let lowStock = 0

                // Invoice Stats
                ; (invoices || []).forEach(inv => {
                    const amount = Number(inv.total_amount) || 0
                    if (inv.type === 'SALE') sales += amount
                    if (inv.type === 'PURCHASE') purchases += amount
                    if (inv.status !== 'PAID') pending += amount
                })

            // Inventory Stats
            const topItems = (items || [])
                .sort((a, b) => b.stock_quantity - a.stock_quantity)
                .slice(0, 3);

            (items || []).forEach(item => {
                if (item.stock_quantity <= 5) {
                    lowStock++
                }
            })

            // Finance Stats
            let cash = 0, bank = 0, online = 0;
            const financeActivity = (transactions || []).map((t: any) => {
                const amt = t.type === 'RECEIPT' ? t.amount : -t.amount
                if (t.mode === 'CASH') cash += amt
                if (t.mode === 'BANK') bank += amt
                if (t.mode === 'ONLINE') online += amt

                // Map to Unified Activity Format
                return {
                    id: t.id,
                    type: t.type, // RECEIPT or PAYMENT
                    category: 'FINANCE',
                    amount: t.amount,
                    date: t.date || t.created_at,
                    party_name: t.party?.name || t.description || 'General',
                    status: 'COMPLETED', // Transactions are always done
                    mode: t.mode
                }
            });

            // Party Stats
            let receivables = 0, payables = 0;
            (parties || []).forEach(p => {
                const bal = p.opening_balance || 0
                if (bal > 0) receivables += bal
                if (bal < 0) payables += Math.abs(bal)
            })

            // Unified Feed Construction
            const invoiceActivity = (invoices || []).map(inv => ({
                id: inv.id,
                type: inv.type, // SALE or PURCHASE
                category: 'INVOICE',
                amount: inv.total_amount,
                date: inv.date || inv.created_at,
                party_name: (parties || []).find((p: any) => p.id === inv.party_id)?.name || 'Unknown', // Manual mapping
                status: inv.status,
                number: inv.invoice_number
            }))

            const unifiedFeed = [...invoiceActivity, ...financeActivity]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Top 10 unified events

            setStats({
                totalSales: sales,
                totalPurchases: purchases,
                netProfit: sales - purchases,
                pendingPayments: pending,
                lowStockCount: lowStock,
                recentActivity: unifiedFeed,
                topItems,
                cashBalance: cash,
                bankBalance: bank,
                onlineBalance: online,
                totalReceivables: receivables,
                totalPayables: payables
            })

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()

        if (!activeBusinessId) return

        // Realtime Subscription
        const channel = supabase
            .channel('dashboard-comprehensive-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `business_id=eq.${activeBusinessId}` }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `business_id=eq.${activeBusinessId}` }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `business_id=eq.${activeBusinessId}` }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `business_id=eq.${activeBusinessId}` }, fetchDashboardData)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeBusinessId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Activity className="h-6 w-6 text-[var(--primary-green)] animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-24">
            {/* 1. Command Header */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-lg font-black text-[var(--deep-contrast)] dark:text-white tracking-tight leading-none mb-1">DASHBOARD</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Live Operations Center</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/sales/new" className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                        <Plus className="h-3 w-3" /> Sale
                    </Link>
                    <Link href="/dashboard/purchases/new" className="h-8 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <Plus className="h-3 w-3" /> Purchase
                    </Link>
                </div>
            </div>

            {/* 2. Primary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                    { label: 'Total Sales', val: stats.totalSales, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Total Purchases', val: stats.totalPurchases, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Net Profit', val: stats.netProfit, icon: BarChart3, color: stats.netProfit >= 0 ? 'text-violet-500' : 'text-rose-500', bg: stats.netProfit >= 0 ? 'bg-violet-500/10' : 'bg-rose-500/10' },
                    { label: 'Pending Due', val: stats.pendingPayments, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass p-3 rounded-xl border border-[var(--foreground)]/5 dark:border-white/5 flex items-center justify-between group hover:border-[var(--foreground)]/10 transition-colors"
                    >
                        <div>
                            <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-0.5">{item.label}</p>
                            <h3 className="text-sm font-black text-[var(--deep-contrast)] tracking-tight">{formatCurrency(item.val)}</h3>
                        </div>
                        <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center transition-colors", item.bg, item.color)}>
                            <item.icon className="h-4 w-4" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 3. Operational Pulse (Finance & Parties) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Cash Flow Pulse */}
                <div className="glass p-3 rounded-xl border border-[var(--foreground)]/5 dark:border-white/5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-[var(--foreground)]/5 pb-2">
                        <Wallet className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                        <h3 className="text-[10px] font-black text-[var(--foreground)]/70 uppercase tracking-widest">Financial Pulse</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[var(--foreground)]/5 rounded-lg p-2 text-center relative overflow-hidden group hover:bg-[var(--foreground)]/10 transition-colors">
                            <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-1">Cash</p>
                            <p className="text-[10px] font-black text-[var(--deep-contrast)] truncate">{formatCurrency(stats.cashBalance)}</p>
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500 opacity-50"></div>
                        </div>
                        <div className="bg-[var(--foreground)]/5 rounded-lg p-2 text-center relative overflow-hidden group hover:bg-[var(--foreground)]/10 transition-colors">
                            <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-1">Bank</p>
                            <p className="text-[10px] font-black text-[var(--deep-contrast)] truncate">{formatCurrency(stats.bankBalance)}</p>
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 opacity-50"></div>
                        </div>
                        <div className="bg-[var(--foreground)]/5 rounded-lg p-2 text-center relative overflow-hidden group hover:bg-[var(--foreground)]/10 transition-colors">
                            <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-1">Online</p>
                            <p className="text-[10px] font-black text-[var(--deep-contrast)] truncate">{formatCurrency(stats.onlineBalance)}</p>
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-500 opacity-50"></div>
                        </div>
                    </div>
                </div>

                {/* Party Balances */}
                <div className="glass p-3 rounded-xl border border-[var(--foreground)]/5 dark:border-white/5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-[var(--foreground)]/5 pb-2">
                        <Users className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                        <h3 className="text-[10px] font-black text-[var(--foreground)]/70 uppercase tracking-widest">Party Balances</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 flex items-center justify-between group hover:bg-emerald-500/10 transition-colors">
                            <div>
                                <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-wider">To Receive</p>
                                <p className="text-[11px] font-black text-emerald-600 truncate">{formatCurrency(stats.totalReceivables)}</p>
                            </div>
                            <ArrowDownRight className="h-4 w-4 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-2 flex items-center justify-between group hover:bg-rose-500/10 transition-colors">
                            <div>
                                <p className="text-[8px] font-bold text-rose-600/60 uppercase tracking-wider">To Pay</p>
                                <p className="text-[11px] font-black text-rose-600 truncate">{formatCurrency(stats.totalPayables)}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-rose-500/40 group-hover:text-rose-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 4. Unified Activity Feed */}
                <div className="lg:col-span-2 glass rounded-2xl border border-[var(--foreground)]/5 dark:border-white/5 overflow-hidden flex flex-col">
                    <div className="h-12 border-b border-[var(--foreground)]/5 px-4 flex items-center justify-between bg-[var(--foreground)]/[0.02]">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                            <h3 className="text-[10px] font-black text-[var(--foreground)]/70 uppercase tracking-widest">Unified Activity Feed</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-[var(--foreground)]/5">
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-8 text-center opacity-50">
                                <p className="text-[9px] font-bold text-[var(--foreground)]/30 uppercase tracking-widest">No recent activity</p>
                            </div>
                        ) : (
                            stats.recentActivity.map((activity, i) => (
                                <div key={activity.id} className="p-3 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group cursor-default">
                                    <div className="flex items-center gap-3">
                                        {/* Icon Box */}
                                        <div className={clsx(
                                            "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                            activity.category === 'INVOICE'
                                                ? (activity.type === 'SALE' ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600")
                                                : (activity.type === 'RECEIPT' ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600")
                                        )}>
                                            {activity.category === 'INVOICE'
                                                ? (activity.type === 'SALE' ? <FileText className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />)
                                                : (activity.type === 'RECEIPT' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />)
                                            }
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <p className="text-[11px] font-bold text-[var(--deep-contrast)] leading-none">
                                                    {activity.party_name}
                                                </p>
                                                {/* Mini Tag */}
                                                <span className={clsx(
                                                    "text-[6px] px-1 py-0.5 rounded-[3px] font-black uppercase tracking-widest border",
                                                    activity.category === 'INVOICE'
                                                        ? "border-[var(--foreground)]/10 text-[var(--foreground)]/50"
                                                        : "border-purple-500/20 text-purple-600 bg-purple-500/5"
                                                )}>
                                                    {activity.category === 'INVOICE' ? activity.type : activity.mode}
                                                </span>
                                            </div>

                                            <p className="text-[9px] font-medium text-[var(--foreground)]/40 flex items-center gap-1.5">
                                                <span>{format(new Date(activity.date), 'h:mm a')}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-[var(--foreground)]/20" />
                                                <span>{activity.number ? `#${activity.number}` : 'Transaction'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Amount & Status */}
                                    <div className="text-right">
                                        <p className={clsx(
                                            "text-[11px] font-black mb-0.5",
                                            (activity.type === 'SALE' || activity.type === 'RECEIPT') ? "text-emerald-600" : "text-[var(--deep-contrast)]"
                                        )}>
                                            {(activity.type === 'SALE' || activity.type === 'RECEIPT') ? '+' : '-'} {formatCurrency(activity.amount)}
                                        </p>
                                        {activity.category === 'INVOICE' ? (
                                            <span className={clsx(
                                                "inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                                activity.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                            )}>
                                                {activity.status}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-600/60">
                                                <BadgeCheck className="h-2.5 w-2.5" /> Done
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 5. Inventory Highlights */}
                <div className="space-y-2">
                    <div className="glass p-4 rounded-2xl border border-[var(--foreground)]/5 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <AlertCircle className="h-24 w-24 text-rose-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest mb-2">Inventory Alert</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-rose-500">{stats.lowStockCount}</span>
                                <span className="text-[10px] font-bold text-rose-500/40 uppercase tracking-wider">Low Stock</span>
                            </div>
                            <Link href="/dashboard/inventory" className="mt-3 inline-flex items-center text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider gap-1">
                                Check Stock <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border border-[var(--foreground)]/5 dark:border-white/5 overflow-hidden flex-1">
                        <div className="h-10 border-b border-[var(--foreground)]/5 px-4 flex items-center justify-between bg-[var(--foreground)]/[0.02]">
                            <h3 className="text-[9px] font-black text-[var(--foreground)]/60 uppercase tracking-widest">Top Movers</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {stats.topItems.map((item, i) => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--foreground)]/5 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-5 w-5 rounded bg-[var(--foreground)]/5 flex items-center justify-center text-[9px] font-bold text-[var(--foreground)]/40">
                                            {i + 1}
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--deep-contrast)] truncate">{item.name}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-[var(--primary-green)] bg-[var(--primary-green)]/10 px-1.5 py-0.5 rounded">
                                        {item.stock_quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Navigation Shortcuts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {[
                    { href: '/dashboard/sales', label: 'Sales', start: 'Invoices', icon: FileText, color: 'emerald' },
                    { href: '/dashboard/purchases', label: 'Purchases', start: 'Expenses', icon: ShoppingCart, color: 'blue' },
                    { href: '/dashboard/inventory', label: 'Inventory', start: 'Stock', icon: Package, color: 'orange' },
                    { href: '/dashboard/parties', label: 'Parties', start: 'Contacts', icon: Users, color: 'purple' },
                ].map((item) => (
                    <Link key={item.label} href={item.href} className={`group p-3 rounded-xl bg-${item.color}-500/5 hover:bg-${item.color}-500/10 border border-${item.color}-500/10 transition-all flex items-center gap-3 active:scale-95`}>
                        <div className={`h-8 w-8 rounded-lg bg-${item.color}-500/10 text-${item.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className={`text-[10px] font-black text-${item.color}-900 dark:text-${item.color}-100 uppercase tracking-wider`}>{item.label}</h4>
                            <p className={`text-[9px] font-medium text-${item.color}-900/40 dark:text-${item.color}-100/40`}>{item.start}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
