'use client'

import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)]">Reports</h1>
                <p className="mt-1 text-[var(--text-secondary)]">Insights into your business performance</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-main)]">Profit & Loss</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Total Revenue</span>
                            <span className="text-[var(--text-main)] font-medium">$12,450</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Total Expenses</span>
                            <span className="text-[var(--text-main)] font-medium">$4,200</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--surface-highlight)] text-[var(--success)]">
                            <span>Net Profit</span>
                            <span>$8,250</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 rounded bg-[var(--info)]/10 text-[var(--info)]">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-main)]">Sales Trend</h3>
                    </div>
                    <div className="h-32 flex items-center justify-center border border-dashed border-[var(--surface-highlight)] rounded text-[var(--text-muted)] text-sm">
                        Chart Placeholder
                    </div>
                </div>
            </div>
        </div>
    )
}
