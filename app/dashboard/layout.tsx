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

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '/dashboard/sales', icon: FileText },
    { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingCart },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Finance', href: '/dashboard/finance', icon: Wallet },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Parties', href: '/dashboard/parties', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const { businesses, activeBusinessId, setActiveBusinessId } = useBusiness()

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

    const activeBusiness = businesses.find(b => b.id === activeBusinessId)

    return (
        <div className="flex min-h-screen bg-transparent">
            {/* Desktop Sidebar (Glassmorphic) - Compact */}
            <div className="hidden lg:flex w-60 flex-col fixed inset-y-0 z-50 p-2">
                <div className="flex flex-col flex-grow glass rounded-[24px] overflow-hidden shadow-2xl border border-white/30 ring-1 ring-white/20">
                    <div className="relative border-b border-white/10 bg-white/5 flex items-center h-16">
                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex-1 flex items-center h-full pl-5 pr-2 gap-3 hover:bg-white/10 transition-colors group text-left min-w-0"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-green)] to-[var(--deep-contrast)] text-white shadow-lg shadow-[var(--primary-green)]/30 shrink-0">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h1 className="text-sm font-bold text-[var(--deep-contrast)] tracking-tight truncate uppercase">{activeBusiness?.name || 'SELECT BIZ'}</h1>
                                <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-0.5">Switch Identity</p>
                            </div>
                        </button>

                        <div className="flex items-center gap-1 pr-5 h-full">
                            {/* NotificationCenter has its own button, so it handles clicks separately */}
                            <NotificationCenter />
                            {/* The Plus was previously just visual, or maybe for adding business? 
                                If it's for adding business, it should be part of the switcher or a separate button. 
                                Since it was just an icon before, I'll leave it here as a visual indicator or make it open the switcher too if clicked?
                                For now, just rendering it. To act as switcher trigger it needs to be in the button or have same onclick.
                            */}
                            <button onClick={() => setIsSwitcherOpen(true)} className="hover:bg-black/5 p-1 rounded-full transition-colors">
                                <Plus className="h-3 w-3 opacity-20" />
                            </button>
                        </div>
                    </div>

                    <PickerModal
                        isOpen={isSwitcherOpen}
                        onClose={() => setIsSwitcherOpen(false)}
                        onSelect={(id) => setActiveBusinessId(id)}
                        title="Switch Business"
                        options={businesses.map(b => ({
                            id: b.id,
                            label: b.name.toUpperCase(),
                            subLabel: b.isOwner ? 'OWNER' : 'JOINED TEAM'
                        }))}
                        selectedValue={activeBusinessId}
                        footer={(
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(true)
                                    setIsSwitcherOpen(false)
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[var(--primary-green)] bg-white/40 border border-[var(--primary-green)]/10 hover:bg-[var(--primary-green)] hover:text-white transition-all active:scale-[0.98]"
                            >
                                <Plus className="h-3 w-3" />
                                Add Business
                            </button>
                        )}
                    />


                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'group flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 relative overflow-hidden',
                                        isActive
                                            ? 'text-white shadow-md shadow-[var(--primary-green)]/20 translate-x-1'
                                            : 'text-[var(--foreground)]/70 hover:bg-white/40 hover:text-[var(--deep-contrast)] hover:translate-x-1'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-[var(--primary-green)] bg-opacity-100" />
                                    )}
                                    <item.icon
                                        className={clsx(
                                            'mr-3 h-4 w-4 flex-shrink-0 relative z-10 transition-colors',
                                            isActive ? 'text-white' : 'text-[var(--foreground)]/50 group-hover:text-[var(--primary-green)]'
                                        )}
                                    />
                                    <span className="relative z-10">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 bg-white/5 border-t border-white/10 space-y-2">
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-[var(--primary-green)] bg-[var(--primary-green)]/5 hover:bg-[var(--primary-green)] hover:text-white rounded-xl transition-all border border-[var(--primary-green)]/10"
                        >
                            <UserPlus className="mr-3 h-4 w-4" />
                            Invite Members
                        </button>
                        <Link
                            href="/dashboard/settings"
                            className={clsx(
                                'flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all',
                                pathname === '/dashboard/settings'
                                    ? 'bg-[var(--primary-green)] text-white shadow-lg'
                                    : 'text-[var(--foreground)]/60 hover:bg-white/10 hover:text-[var(--deep-contrast)]'
                            )}
                        >
                            <Settings className="mr-3 h-4 w-4" />
                            Account Settings
                        </Link>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut()
                                router.push('/login')
                                router.refresh()
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sign Out
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
                            ? "bg-white border-b border-black/5 shadow-md"
                            : "bg-transparent"
                    )} />

                    <div className="relative z-10 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] box-content">
                        <div className="w-10" /> {/* Spacer */}
                        <h2 className="text-[10px] font-bold text-[var(--deep-contrast)] uppercase tracking-widest">{activeBusiness?.name || 'MEMBER'}</h2>
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
                                duration: 0.25,
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
