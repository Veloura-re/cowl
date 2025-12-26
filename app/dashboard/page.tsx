export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)]">Dashboard</h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                    Welcome to your business command center.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Sales', value: '$12,450', change: '+12%', color: 'var(--primary)' },
                    { label: 'Total Purchases', value: '$4,200', change: '+5%', color: 'var(--info)' },
                    { label: 'Parties Balance', value: '$2,800', change: '-2%', color: 'var(--warning)' },
                    { label: 'Stock Value', value: '$15,600', change: '+8%', color: 'var(--success)' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6 shadow-sm hover:border-[var(--primary)]/50 transition-colors"
                    >
                        <p className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-[var(--text-main)]">{stat.value}</p>
                        <p className="mt-1 text-sm font-medium" style={{ color: stat.color }}>
                            {stat.change} from last month
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Actions Placeholder */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-2 rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">
                        Recent Activity
                    </h3>
                    <div className="h-48 flex items-center justify-center text-[var(--text-muted)] border border-dashed border-[var(--surface-highlight)] rounded-lg">
                        No recent activity (Mock)
                    </div>
                </div>

                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        {['New Invoice', 'Add Purchase', 'Add Party', 'New Item'].map((action) => (
                            <button
                                key={action}
                                className="w-full rounded-lg bg-[var(--surface-highlight)] px-4 py-3 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--primary)] hover:text-[var(--background)] transition-all text-left flex items-center justify-between group"
                            >
                                {action}
                                <span className="text-[var(--text-muted)] group-hover:text-[var(--background)] text-lg">
                                    +
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
