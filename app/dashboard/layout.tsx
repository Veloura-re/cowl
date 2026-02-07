'use client'

import { useState, useEffect } from 'react'
import { Menu, Building2, LogOut, LayoutDashboard, FileText, ShoppingCart, Package, Wallet, BarChart3, ChevronDown, Plus, Users, Settings, CreditCard, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { BottomNav } from '@/components/ui/BottomNav'
import { BusinessProvider, useBusiness } from '@/context/business-context'
import PickerModal from '@/components/ui/PickerModal'
import { UserPlus } from 'lucide-react'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { SignOutModal } from '@/components/ui/SignOutModal'
import VisualTutorial, { TutorialStep } from '@/components/ui/VisualTutorial'
import { BrandLogo } from '@/components/ui/BrandLogo'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import FeedbackModal from '@/components/ui/FeedbackModal'
import dynamic from 'next/dynamic'
import { memo } from 'react'

// Dynamic imports for heavy modals to improve initial load
const CreateBusinessModal = dynamic(() => import('@/components/ui/CreateBusinessModal'), { ssr: false })
const BusinessSwitcherModal = dynamic(() => import('@/components/ui/BusinessSwitcherModal'), { ssr: false })
const AddTeamMemberModal = dynamic(() => import('@/components/ui/AddTeamMemberModal'), { ssr: false })

const navigation = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sell', href: '/dashboard/sales', icon: FileText },
    { name: 'Purchase', href: '/dashboard/purchases', icon: ShoppingCart },
    { name: 'Stock', href: '/dashboard/inventory', icon: Package },
    { name: 'Finances', href: '/dashboard/finance', icon: Wallet },
    { name: 'Expenses', href: '/dashboard/expenses', icon: CreditCard },
    { name: 'Business Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'People', href: '/dashboard/parties', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const getTutorialSteps = (pathname: string): TutorialStep[] => {
    const commonSteps: TutorialStep[] = [
        {
            title: "Business Identity",
            content: "Switch between different businesses or add a new one here.",
            targetId: "business-switcher",
            position: "bottom"
        },
        {
            title: "Navigation",
            content: "Access Sales, Purchases, Inventory, and Financial reports from this menu.",
            targetId: "nav-menu",
            position: "right"
        }
    ]

    if (pathname === '/dashboard') {
        return [
            {
                title: "Welcome to Claire",
                content: "Let's take a quick tour of your business dashboard. This guide will help you get started in seconds.",
                position: "center"
            },
            {
                title: "Quick Actions",
                content: "Create new Sales and Purchases instantly from here.",
                targetId: "quick-actions",
                position: "bottom"
            },
            {
                title: "Live Operations",
                content: "Keep track of your total sales, purchases, and net profit in real-time.",
                targetId: "main-metrics",
                position: "bottom"
            },
            {
                title: "Money Status",
                content: "Monitor your cash, bank, and online balances at a glance.",
                targetId: "money-status",
                position: "top"
            },
            {
                title: "Activity Feed",
                content: "See every transaction as it happens. Transparency is key to a healthy business.",
                targetId: "activity-feed",
                position: "top"
            },
            ...commonSteps,
            {
                title: "Stay Notified",
                content: "Keep track of stock alerts and important updates with the notification center.",
                targetId: "notifications",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/sales') {
        return [
            {
                title: "Sales Ledger",
                content: "This is where all your outgoing invoices and sales records live.",
                position: "center"
            },
            {
                title: "Record a Sale",
                content: "Click aquí to generate a new invoice and update your records.",
                targetId: "new-entry-btn",
                position: "bottom"
            },
            {
                title: "Sales Performance",
                content: "Track your total revenue, pending payments, and unpaid bills.",
                targetId: "sales-stats",
                position: "bottom"
            },
            {
                title: "Invoice List",
                content: "Manage individual invoices, print them, or edit details by tapping on any card.",
                targetId: "sales-list",
                position: "top"
            }
        ]
    }

    if (pathname === '/dashboard/purchases') {
        return [
            {
                title: "Purchase Log",
                content: "Keep track of stock you've bought and payments made to suppliers.",
                position: "center"
            },
            {
                title: "Log a Purchase",
                content: "Record new stock acquisitions and manage your payables.",
                targetId: "new-purchase-btn",
                position: "bottom"
            },
            {
                title: "Expense Metrics",
                content: "See exactly how much you're spending and what's still due to suppliers.",
                targetId: "purchases-stats",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/inventory') {
        return [
            {
                title: "Inventory Vault",
                content: "Your entire product catalog and stock levels are managed here.",
                position: "center"
            },
            {
                title: "Add New Product",
                content: "Add new items, set minimum stock alerts, and manage pricing.",
                targetId: "add-item-btn",
                position: "bottom"
            },
            {
                title: "Stock Alerts",
                content: "Items that fall below your minimum threshold will be highlighted for reordering.",
                targetId: "inventory-stats",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/finance') {
        return [
            {
                title: "Financial Ledger",
                content: "Master your cash flow. Track every penny coming in and going out.",
                position: "center"
            },
            {
                title: "Record Movement",
                content: "Log physical cash, bank transfers, or online payments here.",
                targetId: "finance-actions",
                position: "bottom"
            },
            {
                title: "Account Balances",
                content: "Monitor separate totals for your Cash, Bank, and Online wallets.",
                targetId: "finance-modes",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/expenses') {
        return [
            {
                title: "Expense Management",
                content: "Track business overheads and categorize your spending.",
                position: "center"
            },
            {
                title: "Organize Categories",
                content: "Create custom categories for better financial organization.",
                targetId: "expenses-tabs",
                position: "bottom"
            },
            {
                title: "Log Expense",
                content: "Quickly record business costs to maintain an accurate profit report.",
                targetId: "add-expense-btn",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/parties') {
        return [
            {
                title: "Contacts & Parties",
                content: "Manage your customers and suppliers in one dedicated directory.",
                position: "center"
            },
            {
                title: "Add Person",
                content: "Save contact details and track specific balances for each party.",
                targetId: "add-person-btn",
                position: "bottom"
            },
            {
                title: "Balance Tracking",
                content: "Instantly see who owes you money and who you need to pay.",
                targetId: "parties-stats",
                position: "bottom"
            }
        ]
    }

    if (pathname === '/dashboard/settings') {
        return [
            {
                title: "System Control",
                content: "Configure your business identity, preferences, and security protocols here.",
                position: "center"
            },
            {
                title: "Brand Identity",
                content: "Upload your logo and set your official business details.",
                targetId: "settings-registry-card",
                position: "right"
            },
            {
                title: "Invoice Design",
                content: "Customize your invoice look, including accent colors and thermal receipt support.",
                targetId: "settings-invoice-card",
                position: "right"
            },
            {
                title: "Payment Channels",
                content: "Manage the ways you accept money. Add new modes like M-Pesa or Bank Transfer.",
                targetId: "settings-financial-card",
                position: "left"
            },
            {
                title: "Data Safety",
                content: "Download secure backups of your entire business data or restore from a snapshot.",
                targetId: "settings-governance-card",
                position: "top"
            }
        ]
    }

    return commonSteps
}

const getTutorialTheme = (pathname: string): string => {
    if (pathname.startsWith('/dashboard/sales')) return '#4f46e5' // Indigo
    if (pathname.startsWith('/dashboard/purchases')) return '#f59e0b' // Amber
    if (pathname.startsWith('/dashboard/inventory')) return '#f43f5e' // Rose
    if (pathname.startsWith('/dashboard/finance')) return '#0ea5e9' // Sky
    if (pathname.startsWith('/dashboard/parties')) return '#8b5cf6' // Violet
    return '#10b981' // Emerald (Default)
}

const NavItem = memo(({ item, pathname }: { item: any, pathname: string }) => {
    const isActive = pathname === item.href
    return (
        <Link
            href={item.href}
            className={clsx(
                'group flex items-center px-3 py-2.5 text-[15px] font-black rounded-xl transition-all duration-200 relative overflow-hidden uppercase tracking-tighter',
                isActive
                    ? 'text-[var(--primary-foreground)] shadow-md shadow-[var(--primary-green)]/20 translate-x-1'
                    : 'text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--deep-contrast)] hover:translate-x-1'
            )}
        >
            {isActive && (
                <div className="absolute inset-0 bg-[var(--primary-green)]" />
            )}
            <item.icon
                className={clsx(
                    'mr-3 h-4 w-4 flex-shrink-0 relative z-10 transition-colors',
                    isActive ? 'text-[var(--primary-foreground)]' : 'text-[var(--foreground)]/20 group-hover:text-[var(--primary-green)]'
                )}
            />
            <span className="relative z-10">{item.name}</span>
        </Link>
    )
})

NavItem.displayName = 'NavItem'


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const { businesses, activeBusinessId, setActiveBusinessId, isGlobalLoading, feedback, setFeedback, isDockHidden, showTutorial, setShowTutorial, startTutorial } = useBusiness()

    const [scrolled, setScrolled] = useState(false)
    const [scrollingUp, setScrollingUp] = useState(false)
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [shouldHideDock, setShouldHideDock] = useState(false)

    useEffect(() => {
        const hideDockRoutes = [
            '/dashboard/sales/new',
            '/dashboard/sales/edit',
            '/dashboard/purchases/new',
            '/dashboard/purchases/edit',
            '/dashboard/inventory/new',
            '/dashboard/inventory/edit'
        ]
        setShouldHideDock(hideDockRoutes.some(route => pathname.startsWith(route)))
    }, [pathname])

    useEffect(() => {
        let lastScrollY = window.scrollY
        let ticking = false

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY
                    setScrolled(currentScrollY > 10)
                    setScrollingUp(currentScrollY < lastScrollY && currentScrollY > 10)
                    lastScrollY = currentScrollY
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Daily Stock Reminder Trigger
    useEffect(() => {
        if (!activeBusinessId) return

        const triggerReminders = async () => {
            await supabase.rpc('trigger_daily_stock_reminders', {
                p_business_id: activeBusinessId
            })
        }
        triggerReminders()
    }, [activeBusinessId])

    const activeBusiness = businesses.find(b => b.id === activeBusinessId)

    return (
        <div className="flex h-[100dvh] bg-transparent overflow-hidden">
            {/* Desktop Sidebar (Glassmorphic) - Compact */}
            <div className="hidden lg:flex w-60 flex-col fixed inset-y-0 z-50 p-2">
                <div className="flex flex-col flex-grow glass rounded-[24px] overflow-hidden shadow-2xl border border-[var(--foreground)]/10 dark:border-white/10 ring-1 ring-[var(--foreground)]/5 dark:ring-white/20">
                    <div className="relative border-b border-[var(--foreground)]/5 bg-[var(--foreground)]/5 flex items-center h-16">
                        <button
                            id="business-switcher"
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex-1 flex items-center h-full pl-5 pr-2 gap-3 hover:bg-[var(--foreground)]/5 transition-colors group text-left min-w-0"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]/5 shadow-xl border border-[var(--foreground)]/10 dark:border-white/40 shrink-0 group-hover:bg-[var(--foreground)]/10 transition-all">
                                <BrandLogo size="md" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h1 className="text-sm font-black text-[var(--deep-contrast)] tracking-tight truncate uppercase">{activeBusiness?.name || 'SELECT BIZ'}</h1>
                                <p className="text-[12px] font-black text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Switch Identity</p>
                            </div>
                        </button>

                        <div className="flex items-center gap-1 pr-5 h-full">
                            <div id="notifications">
                                <NotificationCenter />
                            </div>
                            <button onClick={() => setIsSwitcherOpen(true)} className="hover:bg-[var(--foreground)]/10 p-1.5 rounded-xl transition-all active:scale-95 group">
                                <Plus className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>



                    <nav id="nav-menu" className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                        {navigation.map((item) => (
                            <NavItem key={item.name} item={item} pathname={pathname} />
                        ))}
                    </nav>

                    <div className="p-4 bg-[var(--foreground)]/5 border-t border-[var(--foreground)]/10 space-y-2">
                        <div className="flex gap-2">
                            <button
                                onClick={startTutorial}
                                className="flex-1 flex items-center justify-center px-3 py-2.5 text-[14px] font-black rounded-xl text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--deep-contrast)] border border-[var(--foreground)]/5 transition-all uppercase tracking-widest"
                                title="Start Tutorial"
                            >
                                <HelpCircle className="h-4 w-4" />
                            </button>
                            <Link
                                id="settings-btn"
                                href="/dashboard/settings"
                                className={clsx(
                                    'flex-1 flex items-center justify-center px-3 py-2.5 text-[14px] font-black rounded-xl transition-all uppercase tracking-widest',
                                    pathname === '/dashboard/settings'
                                        ? 'bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg'
                                        : 'text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--deep-contrast)] border border-[var(--foreground)]/5'
                                )}
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                            <button
                                onClick={() => setIsSignOutModalOpen(true)}
                                className="flex-1 h-10 flex items-center justify-center px-3 py-2.5 text-[14px] font-black text-rose-500/60 hover:bg-rose-500 hover:text-white rounded-xl transition-all uppercase tracking-widest active:scale-95 group shadow-sm border border-rose-500/10"
                            >
                                <LogOut className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                        <button
                            id="invite-btn"
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full mt-2 flex items-center justify-center px-4 py-2 text-[13px] font-black text-[var(--primary-green)] bg-[var(--primary-green)]/5 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] active:bg-[var(--primary-active)] rounded-xl transition-all border border-[var(--primary-green)]/10 uppercase tracking-widest shadow-sm active:scale-95"
                        >
                            <UserPlus className="mr-2 h-3.5 w-3.5" />
                            Invite
                        </button>
                    </div>

                </div>
            </div>

            {/* Main Content Area - Compact */}
            <div className="flex-1 flex flex-col lg:pl-60 w-full transition-all duration-200">
                {/* Mobile Header (Minimalist) - Dynamic Transparency */}
                <header className={clsx(
                    "lg:hidden sticky top-0 z-[60] transition-all duration-200 border-b",
                    scrolled
                        ? "bg-[var(--background)]/80 backdrop-blur-md border-[var(--foreground)]/5 shadow-sm"
                        : "bg-transparent border-transparent"
                )}>
                    {/* Safe Area Spacer + Header Content */}
                    <div className="flex h-10 items-center justify-between px-4 box-content" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}>
                        <button
                            id="business-switcher-mobile"
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex items-center gap-3 active:scale-95 transition-all group max-w-[60%]"
                        >
                            <div className="w-10 flex items-center justify-center shrink-0">
                                <BrandLogo size="sm" />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <h2 className="text-[14px] font-black text-[var(--deep-contrast)] uppercase tracking-wider truncate">
                                        {activeBusiness ? activeBusiness.name : (businesses.length > 0 ? businesses[0].name : 'Loading...')}
                                    </h2>
                                    <ChevronDown className="h-2.5 w-2.5 text-[var(--foreground)]/40 group-hover:text-[var(--primary-green)] transition-colors shrink-0" />
                                </div>
                                <p className="text-[11px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] leading-none mt-0.5">Switch Identity</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                id="help-mobile"
                                onClick={startTutorial}
                                className="w-10 h-10 flex items-center justify-center text-[var(--foreground)]/40 active:scale-95 transition-all"
                            >
                                <HelpCircle className="h-5 w-5" />
                            </button>
                            <NotificationCenter />
                            <button
                                id="invite-btn-mobile-header"
                                onClick={() => setIsInviteModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center text-[var(--primary-green)] active:scale-95 transition-all"
                            >
                                <UserPlus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className={clsx(
                    "flex-1 overflow-y-auto p-3 lg:p-6 scrollbar-hide relative pt-0",
                    (shouldHideDock || isDockHidden) ? "pb-6" : "pb-20 lg:pb-6"
                )}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                duration: 0.2,
                                ease: "easeOut"
                            }}
                            className="mx-auto max-w-7xl"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

            </div>

            {/* Mobile Bottom Dock - Moved outside main content to prevent scrolling */}
            {!(shouldHideDock || isDockHidden) && (
                <div id="nav-menu-mobile" className="lg:hidden">
                    <BottomNav />
                </div>
            )}

            <CreateBusinessModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <div id="invite-btn-mobile">
                <AddTeamMemberModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    businessId={activeBusinessId}
                    onSuccess={() => router.refresh()}
                />
            </div>
            <FeedbackModal
                isOpen={feedback.isOpen}
                onClose={() => setFeedback({ ...feedback, isOpen: false })}
                message={feedback.message}
                variant={feedback.variant}
                title={feedback.title}
            />

            {/* Modal Components */}
            <BusinessSwitcherModal
                isOpen={isSwitcherOpen}
                onClose={() => setIsSwitcherOpen(false)}
                businesses={businesses}
                activeBusinessId={activeBusinessId}
                onSelect={(id) => setActiveBusinessId(id)}
                onCreateNew={() => setIsCreateModalOpen(true)}
            />

            <SignOutModal
                isOpen={isSignOutModalOpen}
                onClose={() => !isSigningOut && setIsSignOutModalOpen(false)}
                isLoading={isSigningOut}
                onConfirm={async () => {
                    setIsSigningOut(true)
                    try {
                        const theme = localStorage.getItem('theme')
                        await supabase.auth.signOut()
                        localStorage.clear()
                        if (theme) localStorage.setItem('theme', theme)
                        sessionStorage.clear()
                        window.location.href = '/login'
                    } catch (error) {
                        console.error('Sign out error:', error)
                        window.location.href = '/login'
                    }
                }}
            />

            {/* Global Loading Overlay */}
            <AnimatePresence>
                {isGlobalLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-sm shadow-2xl"
                    >
                        <div className="glass p-8 rounded-3xl border border-[var(--foreground)]/10 dark:border-white/50 flex flex-col items-center gap-4">
                            <LoadingSpinner size="lg" label="Processing..." />
                            <p className="text-[12px] font-bold text-[var(--foreground)]/40 uppercase tracking-[0.3em] animate-pulse">Claire is working</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <VisualTutorial
                key={pathname}
                isOpen={showTutorial}
                steps={getTutorialSteps(pathname)}
                accentColor={getTutorialTheme(pathname)}
                onClose={async () => {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.user) {
                        localStorage.setItem(`tutorial_seen_${session.user.id}`, 'true')
                    }
                    setShowTutorial(false)
                }}
            />
        </div>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BusinessProvider>
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </BusinessProvider>
    )
}
