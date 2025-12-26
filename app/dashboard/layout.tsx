'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    Menu,
    X,
    LogOut,
    Building2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Parties', href: '/dashboard/parties', icon: Users },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Sales', href: '/dashboard/sales', icon: FileText },
    { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingCart },
    { name: 'Finance', href: '/dashboard/finance', icon: Wallet },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--background)]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 transform bg-[var(--surface)] border-r border-[var(--surface-highlight)] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--surface-highlight)]">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                            <Building2 className="h-5 w-5 text-[var(--primary)]" />
                        </div>
                        <span className="text-lg font-bold text-[var(--text-main)] tracking-tight">
                            LUCY
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                                    isActive
                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-highlight)] hover:text-[var(--text-main)]'
                                )}
                            >
                                <item.icon
                                    className={clsx(
                                        'mr-3 h-5 w-5 flex-shrink-0',
                                        isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                                    )}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-[var(--surface-highlight)] p-4">
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-[var(--color-status-error)] rounded-lg hover:bg-[var(--color-status-error)]/10 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between border-b border-[var(--surface-highlight)] bg-[var(--surface)] px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-[var(--text-main)]">LUCY</span>
                    <div className="w-6" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto bg-[var(--background)] p-4 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in zoom-in duration-300">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
