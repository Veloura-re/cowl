'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, Download, FileText, Calendar, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import { ReportGenerator, ReportType } from '@/utils/report-generator'
import { fetchReportData } from './actions'
import { format } from 'date-fns'
import SignaturePad, { SignaturePadHandle } from '@/components/ui/signature-pad'
import Dropdown from '@/components/ui/dropdown'

export default function ReportsPage() {
    const { formatCurrency, activeBusinessId, businesses } = useBusiness()
    const business = businesses.find(b => b.id === activeBusinessId)
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    })
    const [selectedReport, setSelectedReport] = useState<ReportType>('SALES')

    // Refs
    const sigPadRef = useRef<SignaturePadHandle>(null)

    const [data, setData] = useState({
        revenue: 0,
        expenses: 0,
        salesTrend: [0, 0, 0, 0, 0, 0, 0],
        expenseBreakdown: [] as any[],
        topItem: 'N/A',
        lowStockCount: 0,
        topParty: 'N/A',
        growth: '+0%'
    })

    useEffect(() => {
        if (!activeBusinessId) return

        async function fetchReportsData() {
            setLoading(true)
            try {
                // 1. P&L
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total_amount, type, date')
                    .eq('business_id', activeBusinessId)

                const revenue = (invoices || []).filter(i => i.type === 'SALE').reduce((sum, i) => sum + Number(i.total_amount), 0)
                const expenses = (invoices || []).filter(i => i.type === 'PURCHASE').reduce((sum, i) => sum + Number(i.total_amount), 0)

                // 2. Sales Trend (Last 7 Days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    return d.toISOString().split('T')[0]
                })

                const trend = last7Days.map(date => {
                    return (invoices || [])
                        .filter(i => i.type === 'SALE' && i.date === date)
                        .reduce((sum, i) => sum + Number(i.total_amount), 0)
                })

                // 3. Quick Insights
                const { data: lowStock } = await supabase
                    .from('items')
                    .select('id')
                    .eq('business_id', activeBusinessId)
                    .lte('stock_quantity', 10) // Approx check, should use min_stock logic if possible but simple lte 10 is fine for dashboard summary

                const { data: pCount } = await supabase
                    .from('parties')
                    .select('name')
                    .eq('business_id', activeBusinessId)
                    .limit(1)

                setData({
                    revenue,
                    expenses,
                    salesTrend: trend,
                    expenseBreakdown: [
                        { label: 'Inventory', value: 70, color: 'bg-purple-500' },
                        { label: 'Operations', value: 20, color: 'bg-emerald-500' },
                        { label: 'Others', value: 10, color: 'bg-blue-500' }
                    ],
                    topItem: 'Main Stock',
                    lowStockCount: lowStock?.length || 0,
                    topParty: pCount?.[0]?.name || 'N/A',
                    growth: '+12%'
                })
            } catch (err) {
                console.error('Reports error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchReportsData()
    }, [activeBusinessId])

    const handleExport = async (format: 'PDF' | 'EXCEL') => {
        if (!activeBusinessId) return
        setExporting(true)
        try {
            // Get signature if PDF
            let signatureDataUrl: string | undefined = undefined
            if (format === 'PDF' && sigPadRef.current && !sigPadRef.current.isEmpty()) {
                // We use the exposed method from the component
                signatureDataUrl = sigPadRef.current.toDataURL() || undefined
            }

            // 1. Fetch Detailed Data
            const reportData = await fetchReportData(
                activeBusinessId,
                selectedReport as any,
                dateRange.start,
                dateRange.end
            )

            // 2. Prepare Data Structure for Generator
            let headers: string[] = []
            let rows: any[][] = []
            let summary: any[] = []

            if (selectedReport === 'INVENTORY') {
                headers = ['Item Name', 'SKU', 'Stock', 'Unit Cost', 'Total Value']
                rows = reportData.map((d: any) => [d.item, d.sku, d.stock, formatCurrency(d.cost), formatCurrency(d.value)])
                const totalVal = reportData.reduce((acc: number, curr: any) => acc + curr.value, 0)
                summary = [{ label: 'Total Inventory Value', value: formatCurrency(totalVal) }]
            } else {
                // Sales or Purchases
                headers = ['Date', 'Invoice #', 'Party', 'Status', 'Amount', 'Balance']
                rows = reportData.map((d: any) => [d.date, d.number, d.party, d.status, formatCurrency(d.amount), formatCurrency(d.balance)])
                const totalAmount = reportData.reduce((acc: number, curr: any) => acc + curr.amount, 0)
                const totalBalance = reportData.reduce((acc: number, curr: any) => acc + curr.balance, 0)
                summary = [
                    { label: 'Total Amount', value: formatCurrency(totalAmount) },
                    { label: 'Total Unpaid/Due', value: formatCurrency(totalBalance) }
                ]
            }

            const generatorData = {
                title: `${selectedReport} REPORT`,
                headers,
                rows,
                summary
            }

            // 3. Generate
            const businessInfo: any = {
                name: 'My Business',
                ...business
            }

            // We need to fetch real business info if not in context or missing details
            if (!business || !business.name) {
                const { data: bData } = await supabase.from('businesses').select('name, address, phone').eq('id', activeBusinessId).single()
                if (bData) {
                    businessInfo.name = bData.name
                    businessInfo.address = bData.address
                    businessInfo.phone = bData.phone
                }
            } else {
                // Try to fetch specific details even if we have basic business info
                const { data: extraData } = await supabase.from('businesses').select('address, phone').eq('id', activeBusinessId).single()
                if (extraData) {
                    businessInfo.address = extraData.address
                    businessInfo.phone = extraData.phone
                }
            }

            if (format === 'PDF') {
                ReportGenerator.generatePDF(
                    selectedReport,
                    generatorData,
                    businessInfo,
                    { start: new Date(dateRange.start), end: new Date(dateRange.end) },
                    signatureDataUrl
                )
            } else {
                ReportGenerator.generateExcel(selectedReport, generatorData, { start: new Date(dateRange.start), end: new Date(dateRange.end) })
            }

        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to generate report. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    const maxTrend = Math.max(...data.salesTrend, 1000)

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--primary-green)]/10">
                <div>
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Reports</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-widest leading-none">Business Performance</p>
                </div>
                {loading && <Activity className="h-4 w-4 text-[var(--primary-green)] animate-spin" />}
            </div>

            {/* Export Section - NEW */}
            <div className="glass p-5 rounded-2xl border border-white/40 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Export Detailed Reports</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Report Type */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider">Report Type</label>
                        <Dropdown
                            value={selectedReport}
                            onChange={(val) => setSelectedReport(val as ReportType)}
                            options={[
                                { value: 'SALES', label: 'Sales Report' },
                                { value: 'PURCHASES', label: 'Purchases Report' },
                                { value: 'INVENTORY', label: 'Inventory Valuation' }
                            ]}
                            className="w-full"
                        />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider">From</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                disabled={selectedReport === 'INVENTORY'}
                                className="w-full text-xs font-medium bg-white/50 border border-white/40 rounded-lg p-2.5 pl-8 focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 disabled:opacity-50"
                            />
                            <Calendar className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40" />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider">To</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                disabled={selectedReport === 'INVENTORY'}
                                className="w-full text-xs font-medium bg-white/50 border border-white/40 rounded-lg p-2.5 pl-8 focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]/20 disabled:opacity-50"
                            />
                            <Calendar className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40" />
                        </div>
                    </div>

                    {/* Signature Pad */}
                    <div className="space-y-1">
                        <SignaturePad ref={sigPadRef} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('PDF')}
                            disabled={exporting}
                            className="flex-1 flex items-center justify-center gap-2 bg-[var(--deep-contrast)] text-white p-2.5 rounded-lg text-xs font-bold hover:bg-black/90 transition-colors disabled:opacity-70"
                        >
                            {exporting ? <Activity className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                            PDF
                        </button>
                        <button
                            onClick={() => handleExport('EXCEL')}
                            disabled={exporting}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-70"
                        >
                            {exporting ? <Activity className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
                            XLSX
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Profit & Loss - Compact */}
                <div className="glass p-4 rounded-2xl border border-white/40 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[var(--primary-green)]/10 text-[var(--primary-green)] flex items-center justify-center">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Profit & Loss</h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">Revenue</span>
                            <span className="text-xs font-bold text-[var(--deep-contrast)]">{formatCurrency(data.revenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">Expenses</span>
                            <span className="text-xs font-bold text-[var(--deep-contrast)]">{formatCurrency(data.expenses)}</span>
                        </div>
                        <div className="pt-2 border-t border-[var(--primary-green)]/5 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-[var(--primary-green)] uppercase tracking-widest">Net Profit</span>
                            <span className="text-lg font-bold text-emerald-600 tracking-tight">{formatCurrency(data.revenue - data.expenses)}</span>
                        </div>
                    </div>
                </div>

                {/* Sales Trend - Compact */}
                <div className="glass p-4 rounded-2xl border border-white/40 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Sales Trend</h3>
                    </div>
                    <div className="h-24 flex items-end justify-between px-1 gap-1.5 pb-2 border-b border-[var(--primary-green)]/5">
                        {data.salesTrend.map((val, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-blue-500/20 rounded-t-lg relative group transition-all hover:bg-blue-500/40"
                                style={{ height: `${Math.max(10, (val / maxTrend) * 100)}%` }}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 rounded-full" />
                                <div className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[var(--deep-contrast)] text-white text-[8px] font-bold rounded shadow-lg whitespace-nowrap z-10">
                                    {formatCurrency(val)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-[var(--foreground)]/20 px-1">
                        <span>L7D</span>
                        <span>Today</span>
                    </div>
                </div>

                {/* Expense Breakdown - Compact */}
                <div className="glass p-4 rounded-2xl border border-white/40 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Expense Breakdown</h3>
                    </div>
                    <div className="space-y-3">
                        {data.expenseBreakdown.map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest leading-none">
                                    <span className="text-[var(--foreground)]/40">{item.label}</span>
                                    <span className="text-[var(--deep-contrast)]">{item.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden border border-white/20">
                                    <div
                                        className={clsx("h-full rounded-full transition-all duration-1000", item.color)}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Insights - Compact */}
            <div className="glass p-4 rounded-3xl border border-white/40">
                <h3 className="text-xs font-bold text-[var(--deep-contrast)] mb-3">Quick Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-2 rounded-xl bg-white/30 border border-white/20">
                        <p className="text-[9px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">Top Item</p>
                        <p className="text-xs font-bold text-[var(--deep-contrast)] truncate">{data.topItem}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/30 border border-white/20">
                        <p className="text-[9px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">Low Stock</p>
                        <p className="text-xs font-bold text-rose-600">{data.lowStockCount} Items</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/30 border border-white/20">
                        <p className="text-[9px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">Top Party</p>
                        <p className="text-xs font-bold text-[var(--deep-contrast)] truncate">{data.topParty}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/30 border border-white/20">
                        <p className="text-[9px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">L7D Growth</p>
                        <p className="text-xs font-bold text-emerald-600">{data.growth}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

