'use client';
import { DollarSign, TrendingUp, Users, Package, Activity, ArrowRight, ShoppingCart, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useBusiness } from '@/context/business-context';
import { createClient } from '@/utils/supabase/client';

export default function DashboardPage() {
    const { formatCurrency, activeBusinessId } = useBusiness();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        revenue: 0,
        parties: 0,
        stock: 0,
        pending: 0,
        totalExpenses: 0,
        lowStockCount: 0,
        activities: [] as any[]
    });

    useEffect(() => {
        if (!activeBusinessId) return;

        async function fetchDashboardData() {
            setLoading(true);
            try {
                // 1. Parallel fetch all core stats with error resilience
                const results = await Promise.all([
                    supabase.from('invoices').select('total_amount').eq('business_id', activeBusinessId).eq('type', 'SALE'),
                    supabase.from('parties').select('*', { count: 'exact', head: true }).eq('business_id', activeBusinessId),
                    supabase.from('items').select('stock_quantity, min_stock').eq('business_id', activeBusinessId),
                    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', activeBusinessId).eq('status', 'UNPAID'),
                    supabase.from('invoices').select('total_amount').eq('business_id', activeBusinessId).eq('type', 'PURCHASE'),
                    supabase.from('transactions').select('amount').eq('business_id', activeBusinessId).eq('type', 'PAYMENT'),
                    supabase.from('invoices').select('id, type, total_amount, created_at, party:parties(name)').eq('business_id', activeBusinessId).order('created_at', { ascending: false }).limit(5),
                    supabase.from('transactions').select('id, type, amount, created_at, party:parties(name)').eq('business_id', activeBusinessId).order('created_at', { ascending: false }).limit(5)
                ]);

                // Log any query errors
                results.forEach((r, idx) => {
                    if (r.error) console.error(`Dashboard Query ${idx} failed:`, r.error);
                });

                const [salesRes, partiesRes, stockRes, pendingRes, purchasesRes, paymentsRes, latestInvRes, latestTxRes] = results;

                const salesData = salesRes.data || [];
                const partiesCount = partiesRes.count || 0;
                const stockData = stockRes.data || [];
                const pendingCount = pendingRes.count || 0;
                const purchasesData = purchasesRes.data || [];
                const paymentsData = paymentsRes.data || [];
                const latestInv = latestInvRes.data || [];
                const latestTx = latestTxRes.data || [];

                const revenue = salesData.reduce((sum, s) => sum + Number(s.total_amount), 0);
                const totalStock = stockData.reduce((sum, i) => sum + Number(i.stock_quantity), 0);
                const lowStockCount = stockData.filter(i => Number(i.stock_quantity) <= Number((i as any).min_stock)).length;
                const totalExpenses = purchasesData.reduce((sum, p) => sum + Number(p.total_amount), 0) +
                    paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);

                // Combine activities
                const combined = [
                    ...latestInv.map(inv => ({
                        id: inv.id,
                        type: 'INVOICE',
                        title: inv.type === 'SALE' ? `Sale at ${Array.isArray(inv.party) ? inv.party[0]?.name : (inv.party as any)?.name || 'Customer'}` : `Purchase from ${Array.isArray(inv.party) ? inv.party[0]?.name : (inv.party as any)?.name || 'Supplier'}`,
                        subtitle: formatCurrency(inv.total_amount),
                        amountType: inv.type === 'SALE' ? 'INCOME' : 'EXPENSE',
                        date: new Date(inv.created_at),
                        icon: inv.type === 'SALE' ? FileTextIcon : ShoppingCart
                    })),
                    ...latestTx.map(tx => ({
                        id: tx.id,
                        type: 'TRANSACTION',
                        title: tx.type === 'RECEIPT' ? `Payment from ${Array.isArray(tx.party) ? tx.party[0]?.name : (tx.party as any)?.name || 'Customer'}` : `Payment to ${Array.isArray(tx.party) ? tx.party[0]?.name : (tx.party as any)?.name || 'Supplier'}`,
                        subtitle: formatCurrency(tx.amount),
                        amountType: tx.type === 'RECEIPT' ? 'INCOME' : 'EXPENSE',
                        date: new Date(tx.created_at),
                        icon: Receipt
                    }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

                setData({
                    revenue,
                    parties: partiesCount,
                    stock: totalStock,
                    pending: pendingCount,
                    totalExpenses,
                    lowStockCount,
                    activities: combined.map(act => ({
                        ...act,
                        time: act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }))
                });
            } catch (err) {
                console.error('Dashboard optimization error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [activeBusinessId]);

    const stats = [
        { label: 'Revenue', value: formatCurrency(data.revenue), trend: 'Life-time', color: 'emerald', icon: DollarSign },
        { label: 'Parties', value: data.parties.toString(), trend: 'Entities', color: 'blue', icon: Users },
        { label: 'Stock', value: data.stock.toLocaleString(), trend: 'Total Units', color: 'purple', icon: Package },
        { label: 'Pending', value: data.pending.toString(), trend: 'Unpaid bills', color: 'orange', icon: Activity },
    ];

    const actions = [
        { name: 'New Invoice', href: '/dashboard/sales/new' },
        { name: 'Add Purchase', href: '/dashboard/purchases/new' },
        { name: 'Add Party', href: '/dashboard/parties' },
        { name: 'New Item', href: '/dashboard/inventory' },
    ];

    const FileTextIcon = (props: any) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Dashboard Header - Compact */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div>
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] tracking-tight">Overview</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/60 dark:text-neutral-500 uppercase tracking-wider leading-none">Business Snapshot</p>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--foreground)]/5 dark:bg-white/5 border border-[var(--foreground)]/10 dark:border-white/10 rounded-xl shadow-inner">
                    <span className="relative flex h-2 w-2">
                        <span className={clsx(
                            "relative inline-flex rounded-full h-2 w-2",
                            loading ? "bg-amber-500" : "bg-emerald-500"
                        )}></span>
                    </span>
                    <span className="text-[9px] font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] uppercase tracking-wider">
                        {loading ? 'Sync' : 'Live'}
                    </span>
                </div>
            </div>

            {/* Quick Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                        className={clsx(
                            "glass p-2.5 rounded-xl border border-[var(--foreground)]/10 flex flex-col justify-between group hover:bg-[var(--foreground)]/5 dark:hover:bg-white/10 transition-all duration-300",
                            s.label === 'Pending' && data.pending > 0 && "critical-glow-amber",
                            s.label === 'Stock' && data.lowStockCount > 0 && "critical-glow-red"
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <s.icon className={clsx(
                                    "h-3 w-3",
                                    s.color === 'emerald' ? "text-emerald-600" :
                                        s.color === 'blue' ? "text-blue-600" :
                                            s.color === 'purple' ? "text-purple-600" :
                                                "text-orange-600"
                                )} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground)]/40 truncate">{s.label}</span>
                            </div>
                            <p className={clsx(
                                "text-lg font-black tracking-tighter truncate tabular-nums",
                                s.color === 'emerald' ? "text-emerald-600" :
                                    s.color === 'orange' ? "text-orange-600" :
                                        "text-[var(--deep-contrast)] dark:text-[var(--foreground)]"
                            )}>{s.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Dashboard Quick Stats Bar (In/Out) */}
            <div className="flex gap-2">
                <div className="flex-1 glass p-2.5 rounded-[20px] border border-[var(--foreground)]/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">Total Inbound</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-success-border)] bg-[var(--status-success)] text-[var(--status-success-foreground)] shadow-sm">IN</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600 mt-2 tabular-nums">{formatCurrency(data.revenue)}</p>
                </div>

                <div className={clsx(
                    "flex-1 glass p-2.5 rounded-[20px] border border-[var(--foreground)]/10 transition-all duration-500",
                    data.totalExpenses > 10000 && "critical-glow-red" // Glow if expenses are high
                )}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/60">Total Outbound</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-danger-border)] bg-[var(--status-danger)] text-[var(--status-danger-foreground)] shadow-sm">OUT</span>
                    </div>
                    <p className="text-xl font-black text-rose-600 mt-2 tabular-nums">{formatCurrency(data.totalExpenses)}</p>
                </div>

                <div className={clsx(
                    "flex-1 glass p-2.5 rounded-[20px] border border-[var(--foreground)]/10 transition-all duration-500",
                    data.lowStockCount > 0 && "critical-glow-red"
                )}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600/60">Stock Alerts</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[var(--status-info-border)] bg-[var(--status-info)] text-[var(--status-info-foreground)] shadow-sm">LOW</span>
                    </div>
                    <p className="text-xl font-black text-blue-600 mt-2 tabular-nums">{(data as any).lowStockCount || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity - Compact */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-white/10 bg-white/40 dark:bg-white/5 flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] uppercase tracking-wider">Recent Activity</h3>
                            <Link href="/dashboard/reports" className="text-[9px] font-bold text-[var(--primary-green)] uppercase tracking-wider hover:underline">View All</Link>
                        </div>
                        <div className="p-2 space-y-1">
                            {data.activities.length > 0 ? data.activities.map((act) => (
                                <div key={act.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-default">
                                    <act.icon className="h-2.5 w-2.5 text-[var(--primary-green)]/40 shrink-0" />
                                    <p className="text-[10px] font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] leading-tight capitalize truncate flex-1">{act.title.toLowerCase()}</p>
                                    <p className={clsx(
                                        "text-[9px] font-black tabular-nums shrink-0",
                                        act.amountType === 'INCOME' ? "text-[var(--status-success-foreground)]" : "text-[var(--status-danger-foreground)]"
                                    )}>{act.subtitle}</p>
                                    <span className="text-[8px] font-bold text-[var(--foreground)]/30 shrink-0">{act.time}</span>
                                </div>
                            )) : (
                                <div className="py-12 text-center opacity-30">
                                    <p className="text-[9px] font-bold uppercase tracking-wider">{loading ? 'Fetching...' : 'No activity yet'}</p>
                                </div>
                            )}
                            {data.activities.length > 0 && (
                                <div className="py-6 text-center opacity-30">
                                    <p className="text-[9px] font-bold uppercase tracking-wider">End of history</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions - High Density */}
                <div className="space-y-3">
                    <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-white/10 bg-[var(--primary-green)]/5">
                            <h3 className="text-[10px] font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] uppercase tracking-wider">Quick Actions</h3>
                        </div>
                        <div className="p-2 grid gap-1.5">
                            {actions.map((action, i) => (
                                <motion.div
                                    key={action.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link
                                        href={action.href}
                                        className="group w-full h-9 rounded-xl bg-[var(--foreground)]/5 dark:bg-white/5 border border-[var(--foreground)]/10 dark:border-white/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] dark:text-[var(--foreground)] uppercase tracking-wider hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all flex items-center justify-between shadow-sm active:scale-[0.98]"
                                    >
                                        {action.name}
                                        <ArrowRight className="h-3 w-3 text-[var(--primary-green)] group-hover:text-white transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Support/Dev Card */}
                    <div className="glass p-4 rounded-[24px] border border-[var(--foreground)]/10 bg-gradient-to-br from-[var(--primary-green)]/5 to-[var(--background)]">
                        <p className="text-[9px] font-bold text-[var(--primary-green)] uppercase tracking-wider mb-1.5">Pro Tip</p>
                        <p className="text-[10px] font-bold text-[var(--deep-contrast)] leading-relaxed italic opacity-70">
                            "Everything is live. Switch businesses in the sidebar to see instant data isolation."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

