'use client'

import { useState, useEffect } from 'react'
import { Menu, Building2, LogOut, LayoutDashboard, FileText, ShoppingCart, Package, Wallet, BarChart3, ChevronDown, Plus, Users, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { BottomNav } from '@/components/ui/BottomNav'
import { BusinessProvider, useBusiness } from '@/context/business-context'
import CreateBusinessModal from '@/components/ui/CreateBusinessModal'
import PickerModal from '@/components/ui/PickerModal'
import AddTeamMemberModal from '@/components/ui/AddTeamMemberModal'
import { UserPlus } from 'lucide-react'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { BrandLogo } from '@/components/ui/BrandLogo'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import FeedbackModal from '@/components/ui/FeedbackModal'
import BusinessSwitcherModal from '@/components/ui/BusinessSwitcherModal'

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '/dashboard/sales', icon: FileText },
    { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingCart },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Payments', href: '/dashboard/finance', icon: Wallet },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Parties', href: '/dashboard/parties', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const { businesses, activeBusinessId, setActiveBusinessId, isGlobalLoading, feedback, setFeedback } = useBusiness()

    const [scrolled, setScrolled] = useState(false)
    const [scrollingUp, setScrollingUp] = useState(false)
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

    useEffect(() => {
        let lastScrollY = window.scrollY
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            setScrolled(currentScrollY > 10)
            setScrollingUp(currentScrollY < lastScrollY && currentScrollY > 10)
            lastScrollY = currentScrollY
        }
        window.addEventListener('scroll', handleScroll)
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
        <div className="flex min-h-screen bg-transparent">
            {/* Desktop Sidebar (Glassmorphic) - Compact */}
            <div className="hidden lg:flex w-60 flex-col fixed inset-y-0 z-50 p-2">
                <div className="flex flex-col flex-grow glass rounded-[24px] overflow-hidden shadow-2xl border border-[var(--foreground)]/10 dark:border-white/10 ring-1 ring-[var(--foreground)]/5 dark:ring-white/20">
                    <div className="relative border-b border-[var(--foreground)]/5 bg-[var(--foreground)]/5 flex items-center h-16">
                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex-1 flex items-center h-full pl-5 pr-2 gap-3 hover:bg-[var(--foreground)]/5 transition-colors group text-left min-w-0"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]/5 shadow-xl border border-[var(--foreground)]/10 dark:border-white/40 shrink-0 group-hover:bg-[var(--foreground)]/10 transition-all">
                                <BrandLogo size="md" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h1 className="text-sm font-black text-[var(--deep-contrast)] tracking-tight truncate uppercase">{activeBusiness?.name || 'SELECT BIZ'}</h1>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Switch Identity</p>
                            </div>
                        </button>

                        <div className="flex items-center gap-1 pr-5 h-full">
                            <NotificationCenter />
                            <button onClick={() => setIsSwitcherOpen(true)} className="hover:bg-[var(--foreground)]/10 p-1.5 rounded-xl transition-all active:scale-95 group">
                                <Plus className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>



                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'group flex items-center px-3 py-2.5 text-[11px] font-black rounded-xl transition-all duration-300 relative overflow-hidden uppercase tracking-tighter',
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
                        })}
                    </nav>

                    <div className="p-4 bg-[var(--foreground)]/5 border-t border-[var(--foreground)]/10 space-y-2">
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full flex items-center px-4 py-2.5 text-[10px] font-black text-[var(--primary-green)] bg-[var(--primary-green)]/5 hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] active:bg-[var(--primary-active)] rounded-xl transition-all border border-[var(--primary-green)]/10 uppercase tracking-widest shadow-sm active:scale-95"
                        >
                            <UserPlus className="mr-3 h-4 w-4" />
                            Invite Members
                        </button>
                        <Link
                            href="/dashboard/settings"
                            className={clsx(
                                'flex items-center px-4 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest',
                                pathname === '/dashboard/settings'
                                    ? 'bg-[var(--primary-green)] text-[var(--primary-foreground)] shadow-lg'
                                    : 'text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--deep-contrast)]'
                            )}
                        >
                            <Settings className="mr-3 h-4 w-4" />
                            Settings
                        </Link>
                        <button
                            onClick={async () => {
                                try {
                                    await supabase.auth.signOut()
                                    localStorage.clear()
                                    sessionStorage.clear()
                                    window.location.href = '/login'
                                } catch (error) {
                                    console.error('Sign out error:', error)
                                    window.location.href = '/login'
                                }
                            }}
                            className="w-full h-11 flex items-center px-4 py-2.5 text-[10px] font-black text-rose-500/60 hover:bg-rose-500 hover:text-white rounded-xl transition-all uppercase tracking-widest active:scale-95 group shadow-sm border border-rose-500/10"
                        >
                            <LogOut className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                            Log Out
                        </button>
                    </div>

                </div>
            </div>

            {/* Main Content Area - Compact */}
            <div className="flex-1 flex flex-col lg:pl-60 w-full transition-all duration-300">
                {/* Mobile Header (Minimalist) - Compact */}
                <header className="lg:hidden sticky top-0 z-[60] transition-all duration-300">
                    <div className={clsx(
                        "absolute inset-0 transition-all duration-300",
                        scrolled
                            ? "bg-[var(--background)] backdrop-blur-md border-b border-[var(--foreground)]/10 dark:border-white/5 shadow-sm"
                            : "bg-transparent"
                    )} />

                    <div className="relative z-10 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] box-content">
                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex items-center gap-3 active:scale-95 transition-all group max-w-[60%]"
                        >
                            <div className="w-10 flex items-center justify-center shrink-0">
                                <BrandLogo size="sm" />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <h2 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-wider truncate">
                                        {activeBusiness ? activeBusiness.name : (businesses.length > 0 ? businesses[0].name : 'Loading...')}
                                    </h2>
                                    <ChevronDown className="h-2.5 w-2.5 text-[var(--foreground)]/40 group-hover:text-[var(--primary-green)] transition-colors shrink-0" />
                                </div>
                                <p className="text-[7px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] leading-none mt-0.5">Switch Identity</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-1">
                            <NotificationCenter />
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center text-[var(--primary-green)] active:scale-95 transition-all"
                            >
                                <UserPlus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto lg:overflow-visible p-3 lg:p-6 pb-24 lg:pb-6 scrollbar-hide relative pt-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, scale: 0.98, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -4 }}
                            transition={{
                                duration: 0.15,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            className="mx-auto max-w-7xl"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Mobile Bottom Dock */}
                <div className="lg:hidden">
                    <BottomNav />
                </div>
            </div>

            <CreateBusinessModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <AddTeamMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                businessId={activeBusinessId}
                onSuccess={() => router.refresh()}
            />
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

            {/* Global Loading Overlay */}
            <AnimatePresence>
                {isGlobalLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-sm shadow-2xl"
                    >
                        <div className="glass p-8 rounded-3xl border border-[var(--foreground)]/10 dark:border-white/50 flex flex-col items-center gap-4">
                            <LoadingSpinner size="lg" label="Processing..." />
                            <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-[0.3em] animate-pulse">Claire is working</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
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
