'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, Download, FileText, Calendar, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import { ReportGenerator, ReportType } from '@/utils/report-generator'
import { fetchReportDataService, ReportServiceType } from '@/utils/report-service'
import { format, parseISO } from 'date-fns'
import { Capacitor } from '@capacitor/core'
import SignaturePad, { SignaturePadHandle } from '@/components/ui/signature-pad'
import Dropdown from '@/components/ui/dropdown'
import DatePickerModal from '@/components/ui/DatePickerModal'

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
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [isEndOpen, setIsEndOpen] = useState(false)

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

    // Preview report data
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
    const [previewSummary, setPreviewSummary] = useState<any[]>([])

    // Fetch preview data when report type or date range changes
    useEffect(() => {
        if (!activeBusinessId) return

        async function fetchPreviewData() {
            setPreviewLoading(true)
            try {
                const reportData = await fetchReportDataService(
                    activeBusinessId!,
                    selectedReport as any,
                    selectedReport === 'INVENTORY' ? undefined : dateRange.start,
                    selectedReport === 'INVENTORY' ? undefined : dateRange.end
                )

                // Format data based on report type
                let headers: string[] = []
                let rows: any[][] = []
                let summary: any[] = []

                if (selectedReport === 'PROFIT_LOSS') {
                    const plData = reportData[0] as any
                    headers = ['Category', 'Amount', '% of Expenses']
                    rows = plData.breakdown.map((d: any) => [d.category, formatCurrency(d.amount), `${d.percentage}%`])
                    summary = [
                        { label: 'Total Revenue', value: formatCurrency(plData.revenue) },
                        { label: 'Total Expenses', value: formatCurrency(plData.expenses) },
                        { label: 'Net Profit/Loss', value: formatCurrency(plData.netProfit) },
                        { label: 'Profit Margin', value: `${plData.profitMargin}%` }
                    ]
                } else if (selectedReport === 'INVENTORY') {
                    headers = ['Item Name', 'SKU', 'Stock', 'Unit Cost', 'Total Value']
                    rows = reportData.map((d: any) => [d.item, d.sku, d.stock, formatCurrency(d.cost), formatCurrency(d.value)])
                    const totalVal = reportData.reduce((acc: number, curr: any) => acc + curr.value, 0)
                    summary = [{ label: 'Total Stock Value', value: formatCurrency(totalVal) }]
                } else if (selectedReport === 'CUSTOMER_REPORT' || selectedReport === 'SUPPLIER_REPORT') {
                    headers = ['Name', 'Total Amount', 'Amount Paid', 'Balance Due', 'Transactions']
                    rows = reportData.map((d: any) => [d.party, formatCurrency(d.total), formatCurrency(d.paid), formatCurrency(d.balance), d.count])
                    const totalAmount = reportData.reduce((acc: number, curr: any) => acc + curr.total, 0)
                    const totalBalance = reportData.reduce((acc: number, curr: any) => acc + curr.balance, 0)
                    summary = [
                        { label: 'Total Business Volume', value: formatCurrency(totalAmount) },
                        { label: 'Total Outstanding', value: formatCurrency(totalBalance) },
                        { label: 'Number of Parties', value: reportData.length }
                    ]
                } else {
                    headers = ['Date', 'Invoice #', 'Party', 'Status', 'Amount', 'Balance']
                    rows = reportData.map((d: any) => [d.date, d.number, d.party, d.status, formatCurrency(d.amount), formatCurrency(d.balance)])
                    const totalAmount = reportData.reduce((acc: number, curr: any) => acc + curr.amount, 0)
                    const totalBalance = reportData.reduce((acc: number, curr: any) => acc + curr.balance, 0)
                    summary = [
                        { label: `Total Money ${selectedReport === 'SALES' || selectedReport === 'PARTY_SALES' ? 'In' : 'Out'}`, value: formatCurrency(totalAmount) },
                        { label: 'Total Unpaid/Due', value: formatCurrency(totalBalance) }
                    ]
                }

                setPreviewHeaders(headers)
                setPreviewData(rows)
                setPreviewSummary(summary)
            } catch (error) {
                console.error('Failed to fetch preview data:', error)
                setPreviewData([])
            } finally {
                setPreviewLoading(false)
            }
        }

        fetchPreviewData()
    }, [selectedReport, dateRange.start, dateRange.end, activeBusinessId])

    useEffect(() => {
        if (!activeBusinessId) return

        async function fetchReportsData() {
            setLoading(true)
            try {
                // 1. P&L and Sales Trend
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total_amount, type, date, invoice_number, id')
                    .eq('business_id', activeBusinessId)
                    .gte('date', dateRange.start)
                    .lte('date', dateRange.end)

                const revenue = (invoices || []).filter(i => i.type === 'SALE').reduce((sum, i) => sum + Number(i.total_amount), 0)
                const expenses = (invoices || []).filter(i => i.type === 'PURCHASE').reduce((sum, i) => sum + Number(i.total_amount), 0)

                // 2. Sales Trend (Based on selected range)
                // If the range is > 30 days, we might want to aggregate by month/week, but for now we'll stick to daily if range is reasonable
                const daysDiff = (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 3600 * 24)
                let trendDates: string[] = []

                if (daysDiff <= 31) {
                    trendDates = Array.from({ length: Math.floor(daysDiff) + 1 }, (_, i) => {
                        const d = new Date(dateRange.start)
                        d.setDate(d.getDate() + i)
                        return d.toISOString().split('T')[0]
                    })
                } else {
                    // Fallback to last 7 days if range is too large for a simple daily bar chart
                    trendDates = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - (6 - i))
                        return d.toISOString().split('T')[0]
                    })
                }

                const trend = trendDates.map(date => {
                    return (invoices || [])
                        .filter(i => i.type === 'SALE' && i.date === date)
                        .reduce((sum, i) => sum + Number(i.total_amount), 0)
                })

                // 3. Best Selling Product (Real Data)
                const { data: topItemsData } = await supabase
                    .from('invoice_items')
                    .select('item_id, quantity, total, items(name)')
                    .in('invoice_id', (invoices || []).filter(i => i.type === 'SALE').map(i => i.id))

                const itemStats: Record<string, { name: string, total: number }> = {}
                topItemsData?.forEach((row: any) => {
                    const id = row.item_id
                    const name = row.items?.name || 'Unknown'
                    if (!itemStats[id]) itemStats[id] = { name, total: 0 }
                    itemStats[id].total += Number(row.total)
                })

                const sortedItems = Object.values(itemStats).sort((a, b) => b.total - a.total)
                const topItem = sortedItems[0]?.name || 'N/A'

                // 4. Low Stock count
                const { data: lowStock } = await supabase
                    .rpc('get_low_stock_count', { b_id: activeBusinessId })

                // If RPC doesn't exist, fallback to simple query (common in these builds)
                let lowStockCount = 0
                if (lowStock !== undefined && lowStock !== null) {
                    lowStockCount = lowStock
                } else {
                    const { data: items } = await supabase
                        .from('items')
                        .select('id, stock_quantity, min_stock')
                        .eq('business_id', activeBusinessId)

                    lowStockCount = items?.filter(item => Number(item.stock_quantity) <= Number(item.min_stock)).length || 0
                }

                // 5. Best Party (Customer/Supplier)
                const partyStats: Record<string, { name: string, total: number }> = {}
                // We need names for parties
                const { data: partiesWithNames } = await supabase
                    .from('invoices')
                    .select('party_id, total_amount, parties(name)')
                    .eq('business_id', activeBusinessId)
                    .in('id', (invoices || []).map(i => i.id))

                partiesWithNames?.forEach((row: any) => {
                    const id = row.party_id || 'walking'
                    const name = row.parties?.name || 'Walking Customer'
                    if (!partyStats[id]) partyStats[id] = { name, total: 0 }
                    partyStats[id].total += Number(row.total_amount)
                })

                const sortedParties = Object.values(partyStats).sort((a, b) => b.total - a.total)
                const topParty = sortedParties[0]?.name || 'N/A'

                // 6. Expense Breakdown (Real Data)
                const { data: expenseData } = await supabase
                    .from('invoices')
                    .select('total_amount, category, sku')
                    .eq('business_id', activeBusinessId)
                    .eq('type', 'PURCHASE')
                    .gte('date', dateRange.start)
                    .lte('date', dateRange.end)

                const expenseStats: Record<string, number> = {}
                let totalExp = 0
                expenseData?.forEach(exp => {
                    const cat = exp.category || 'Other'
                    expenseStats[cat] = (expenseStats[cat] || 0) + Number(exp.total_amount)
                    totalExp += Number(exp.total_amount)
                })

                const breakdown = Object.entries(expenseStats)
                    .map(([label, value], i) => ({
                        label,
                        value: totalExp > 0 ? Math.round((value / totalExp) * 100) : 0,
                        color: ['bg-indigo-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'][i % 5]
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3) // Keep it to top 3 for the compact UI

                setData({
                    revenue,
                    expenses,
                    salesTrend: trend,
                    expenseBreakdown: breakdown.length > 0 ? breakdown : [
                        { label: 'Inventory', value: 100, color: 'bg-purple-500' }
                    ],
                    topItem,
                    lowStockCount,
                    topParty,
                    growth: '+12%'
                })
            } catch (err) {
                console.error('Reports error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchReportsData()
    }, [activeBusinessId, dateRange.start, dateRange.end])

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
            const reportData = await fetchReportDataService(
                activeBusinessId!,
                selectedReport as any,
                selectedReport === 'INVENTORY' ? undefined : dateRange.start,
                selectedReport === 'INVENTORY' ? undefined : dateRange.end
            )

            // 2. Prepare Data Structure for Generator
            let headers: string[] = []
            let rows: any[][] = []
            let summary: any[] = []

            if (selectedReport === 'PROFIT_LOSS') {
                // Profit & Loss Report - Special formatting
                const plData = reportData[0] as any // P&L returns a single summary object
                headers = ['Category', 'Amount', '% of Expenses']
                rows = plData.breakdown.map((d: any) => [d.category, formatCurrency(d.amount), `${d.percentage}%`])
                summary = [
                    { label: 'Total Revenue', value: formatCurrency(plData.revenue) },
                    { label: 'Total Expenses', value: formatCurrency(plData.expenses) },
                    { label: 'Net Profit/Loss', value: formatCurrency(plData.netProfit) },
                    { label: 'Profit Margin', value: `${plData.profitMargin}%` }
                ]
            } else if (selectedReport === 'INVENTORY') {
                headers = ['Item Name', 'SKU', 'Stock', 'Unit Cost', 'Total Value']
                rows = reportData.map((d: any) => [d.item, d.sku, d.stock, formatCurrency(d.cost), formatCurrency(d.value)])
                const totalVal = reportData.reduce((acc: number, curr: any) => acc + curr.value, 0)
                summary = [{ label: 'Total Stock Value', value: formatCurrency(totalVal) }]
            } else if (selectedReport === 'CUSTOMER_REPORT' || selectedReport === 'SUPPLIER_REPORT') {
                // Party Summary Reports
                headers = ['Name', 'Total Amount', 'Amount Paid', 'Balance Due', 'Transactions']
                rows = reportData.map((d: any) => [d.party, formatCurrency(d.total), formatCurrency(d.paid), formatCurrency(d.balance), d.count])
                const totalAmount = reportData.reduce((acc: number, curr: any) => acc + curr.total, 0)
                const totalBalance = reportData.reduce((acc: number, curr: any) => acc + curr.balance, 0)
                summary = [
                    { label: 'Total Business Volume', value: formatCurrency(totalAmount) },
                    { label: 'Total Outstanding', value: formatCurrency(totalBalance) },
                    { label: 'Number of Parties', value: reportData.length }
                ]
            } else {
                // Sales, Purchases, Party Sales, Party Purchases
                headers = ['Date', 'Invoice #', 'Party', 'Status', 'Amount', 'Balance']
                rows = reportData.map((d: any) => [d.date, d.number, d.party, d.status, formatCurrency(d.amount), formatCurrency(d.balance)])
                const totalAmount = reportData.reduce((acc: number, curr: any) => acc + curr.amount, 0)
                const totalBalance = reportData.reduce((acc: number, curr: any) => acc + curr.balance, 0)
                summary = [
                    { label: `Total Money ${selectedReport === 'SALES' || selectedReport === 'PARTY_SALES' ? 'In' : 'Out'}`, value: formatCurrency(totalAmount) },
                    { label: 'Total Unpaid/Due', value: formatCurrency(totalBalance) }
                ]
            }

            const reportTitles: Record<ReportType, string> = {
                'SALES': 'SALES REPORT (MONEY IN)',
                'PURCHASES': 'PURCHASES REPORT (MONEY OUT)',
                'INVENTORY': 'VALUE OF STOCK REPORT',
                'PROFIT_LOSS': 'PROFIT & LOSS REPORT',
                'CUSTOMER_REPORT': 'CUSTOMER REPORT',
                'SUPPLIER_REPORT': 'SUPPLIER REPORT',
                'PARTY_SALES': 'SALES BY CUSTOMER',
                'PARTY_PURCHASES': 'PURCHASES BY SUPPLIER'
            }

            const generatorData = {
                title: reportTitles[selectedReport] || 'BUSINESS REPORT',
                headers,
                rows,
                summary
            }

            // 3. Generate
            const businessInfo: any = {
                name: 'My Business',
                ...business,
                logoUrl: business?.logo_url
            }

            // We need to fetch real business info if not in context or missing details
            if (!business || !business.name) {
                const { data: bData } = await supabase.from('businesses').select('name, address, phone, logo_url').eq('id', activeBusinessId).single()
                if (bData) {
                    businessInfo.name = bData.name
                    businessInfo.address = bData.address
                    businessInfo.phone = bData.phone
                    businessInfo.logoUrl = bData.logo_url
                }
            } else {
                // Try to fetch specific details even if we have basic business info
                const { data: extraData } = await supabase.from('businesses').select('address, phone, logo_url').eq('id', activeBusinessId).single()
                if (extraData) {
                    businessInfo.address = extraData.address
                    businessInfo.phone = extraData.phone
                    businessInfo.logoUrl = extraData.logo_url
                }
            }

            let file: File | void
            if (format === 'PDF') {
                file = await ReportGenerator.generatePDF(
                    selectedReport,
                    generatorData,
                    businessInfo,
                    { start: new Date(dateRange.start), end: new Date(dateRange.end) },
                    signatureDataUrl
                )
            } else {
                file = await ReportGenerator.generateExcel(
                    selectedReport,
                    generatorData,
                    { start: new Date(dateRange.start), end: new Date(dateRange.end) }
                )
            }

            // 4. Handle Export / Sharing
            const shareSuccess = await ReportGenerator.shareReport(file, generatorData.title)

            if (!shareSuccess && !Capacitor.isNativePlatform()) {
                const url = URL.createObjectURL(file)
                const link = document.createElement('a')
                link.href = url
                link.download = file.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                console.log('Report downloaded successfully')
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
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/5">
                <div>
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] tracking-tight">Business Reports</h1>
                    <p className="text-[10px] font-bold text-[var(--foreground)]/60 dark:text-neutral-500 uppercase tracking-wider leading-none">How your business is doing</p>
                </div>
                {loading && <Activity className="h-4 w-4 text-[var(--primary-green)] animate-spin" />}
            </div>

            {/* Export Section - Redesigned & Compact */}
            <div className="relative group overflow-hidden glass p-4 rounded-3xl border border-neutral-200 dark:border-white/5 shadow-lg shadow-neutral-100 dark:shadow-none bg-white/40 dark:bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/10">
                        <Download className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white tracking-tight">Export Intelligence</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Report Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Focus Area</label>
                        <Dropdown
                            value={selectedReport}
                            onChange={(val) => setSelectedReport(val as ReportType)}
                            options={[
                                { value: 'PROFIT_LOSS', label: '💰 Profit & Loss Statement' },
                                { value: 'SALES', label: 'Sales Performance' },
                                { value: 'PURCHASES', label: 'Purchase Analysis' },
                                { value: 'INVENTORY', label: 'Inventory Valuation' },
                                { value: 'CUSTOMER_REPORT', label: 'Client Landscape' },
                                { value: 'SUPPLIER_REPORT', label: 'Vendor Portfolio' },
                                { value: 'PARTY_SALES', label: 'Revenue by Client' },
                                { value: 'PARTY_PURCHASES', label: 'Spend by Vendor' }
                            ]}
                            className="w-full"
                        />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">From</label>
                        <button
                            type="button"
                            onClick={() => setIsStartOpen(true)}
                            disabled={selectedReport === 'INVENTORY'}
                            className="w-full h-10 flex items-center justify-between px-3 bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all disabled:opacity-50 shadow-inner"
                        >
                            <Calendar className="h-4 w-4 opacity-40 shrink-0" />
                            <span>{format(parseISO(dateRange.start), 'MMM dd, yyyy')}</span>
                            <div className="w-4" />
                        </button>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">To</label>
                        <button
                            type="button"
                            onClick={() => setIsEndOpen(true)}
                            disabled={selectedReport === 'INVENTORY'}
                            className="w-full h-10 flex items-center justify-between px-3 bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all disabled:opacity-50 shadow-inner"
                        >
                            <Calendar className="h-4 w-4 opacity-40 shrink-0" />
                            <span>{format(parseISO(dateRange.end), 'MMM dd, yyyy')}</span>
                            <div className="w-4" />
                        </button>
                    </div>

                    <DatePickerModal
                        isOpen={isStartOpen}
                        onClose={() => setIsStartOpen(false)}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                        selectedValue={dateRange.start}
                        title="Start Date"
                    />

                    <DatePickerModal
                        isOpen={isEndOpen}
                        onClose={() => setIsEndOpen(false)}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                        selectedValue={dateRange.end}
                        title="End Date"
                    />

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport('PDF')}
                            disabled={exporting}
                            className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-black/10"
                        >
                            {exporting ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                            PDF
                        </button>
                        <button
                            onClick={() => handleExport('EXCEL')}
                            disabled={exporting}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-emerald-500/20"
                        >
                            {exporting ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                            XLSX
                        </button>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-white/5 space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.2em] ml-1">OFFICIAL AUTHORIZATION SIGNATURE</label>
                    <div className="relative group rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-white dark:bg-black/20 shadow-inner group-hover:border-indigo-500/30 transition-colors">
                        <SignaturePad ref={sigPadRef} className="h-44" />
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-neutral-100 dark:bg-white/5 text-[8px] font-black text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">SIGN HERE</div>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Profit & Loss - Redesigned & Compact */}
                <div className="relative overflow-hidden glass p-4 rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 group transition-all hover:bg-white/60 dark:hover:bg-white/10">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
                        <BarChart3 className="h-10 w-10 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white tracking-tight">Finance</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center group/item p-1.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Inflow</span>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">{formatCurrency(data.revenue)}</span>
                            </div>
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div className="flex justify-between items-center group/item p-1.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Outflow</span>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">{formatCurrency(data.expenses)}</span>
                            </div>
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex flex-col items-center justify-center py-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl">
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Net</span>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(data.revenue - data.expenses)}</span>
                        </div>
                    </div>
                </div>

                {/* Sales Trend - Redesigned & Compact */}
                <div className="relative overflow-hidden glass p-4 rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 group">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-inner">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white tracking-tight">Timeline</h3>
                    </div>

                    <div className="h-24 flex items-end justify-between px-1 gap-1.5 pb-3">
                        {data.salesTrend.map((val, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-t-lg relative group transition-all hover:bg-indigo-500/20"
                                style={{ height: `${Math.max(15, (val / maxTrend) * 100)}%` }}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 rounded-full" />
                                <div className="hidden group-hover:flex absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-neutral-900 text-white text-[8px] font-black rounded shadow-xl whitespace-nowrap z-10 items-center justify-center border border-white/10">
                                    {formatCurrency(val)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-neutral-400 px-1 pt-1.5 border-t border-neutral-50 dark:border-white/5">
                        <span>L7D</span>
                        <span>Now</span>
                    </div>
                </div>

                {/* Expense Breakdown - Redesigned & Compact */}
                <div className="relative overflow-hidden glass p-4 rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 group">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white tracking-tight">Spending</h3>
                    </div>
                    <div className="space-y-3">
                        {data.expenseBreakdown.map((item, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest leading-none">
                                    <span className="text-neutral-400">{item.label}</span>
                                    <span className="text-neutral-900 dark:text-neutral-200">{item.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
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

            {/* Quick Insights - Unified Theme */}
            <div className="relative overflow-hidden glass p-6 rounded-[32px] border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.03] dark:bg-white/5 shadow-xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-indigo-500 via-emerald-500 to-sky-500 blur-[100px] animate-pulse" />
                </div>

                <h3 className="text-[9px] font-black text-[var(--foreground)]/40 tracking-[0.3em] uppercase mb-4 text-center">Insights Intelligence</h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    <div className="p-3.5 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-[var(--foreground)]/10">
                        <p className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Top Item</p>
                        <p className="text-[11px] font-black text-[var(--deep-contrast)] truncate">{data.topItem}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-[var(--foreground)]/10">
                        <p className="text-[8px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1">Restock</p>
                        <p className="text-[11px] font-black text-[var(--deep-contrast)]">{data.lowStockCount} Items Low</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-[var(--foreground)]/10">
                        <p className="text-[8px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest mb-1">Top Customer</p>
                        <p className="text-[11px] font-black text-[var(--deep-contrast)] truncate">{data.topParty}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-[var(--foreground)]/10">
                        <p className="text-[8px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1">7D Velocity</p>
                        <p className="text-[11px] font-black text-[var(--deep-contrast)]">{data.growth}</p>
                    </div>
                </div>
            </div>

            {/* Report Preview Table */}
            <div className="relative overflow-hidden glass p-6 rounded-[32px] border border-[var(--foreground)]/10 bg-white dark:bg-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-black text-[var(--deep-contrast)] tracking-tight">Report Preview</h3>
                        <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Live Data View</p>
                    </div>
                    {previewLoading && <Activity className="h-4 w-4 text-[var(--primary-green)] animate-spin" />}
                </div>

                {previewLoading ? (
                    <div className="flex items-center justify-center py-20 text-[var(--foreground)]/30">
                        <div className="text-center">
                            <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">Loading report data...</p>
                        </div>
                    </div>
                ) : previewData.length === 0 ? (
                    <div className="flex items-center justify-center py-20 text-[var(--foreground)]/30">
                        <div className="text-center">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest">No data available for this report</p>
                            <p className="text-[9px] text-[var(--foreground)]/20 mt-1">Try adjusting your date range</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-[var(--foreground)]/10">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[var(--foreground)]/5 border-b border-[var(--foreground)]/10">
                                        {previewHeaders.map((header, i) => (
                                            <th key={i} className="px-4 py-3 text-[9px] font-black text-[var(--foreground)]/60 uppercase tracking-widest">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-[var(--foreground)]/5 hover:bg-[var(--foreground)]/[0.02] transition-colors"
                                        >
                                            {row.map((cell: any, j: number) => (
                                                <td key={j} className="px-4 py-2.5 text-[10px] font-bold text-[var(--deep-contrast)]">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {previewData.length > 50 && (
                            <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-3 text-center">
                                Showing first 50 of {previewData.length} records • Export to see all
                            </p>
                        )}

                        {/* Summary KPIs */}
                        {previewSummary.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[var(--foreground)]/10">
                                <h4 className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.3em] mb-4">Key Performance Indicators</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {previewSummary.map((item, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10">
                                            <p className="text-[8px] font-black text-[var(--foreground)]/50 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-sm font-black text-[var(--deep-contrast)]">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

