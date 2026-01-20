'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Package, ShoppingCart, FileText, Users, X, CheckCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useBusiness } from '@/context/business-context'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

type Notification = {
    id: string
    title: string
    message: string
    user_id: string
    type: 'SALE' | 'PURCHASE' | 'STOCK' | 'TEAM' | 'SYSTEM'
    link?: string
    is_read: boolean
    created_at: string
}

export default function NotificationCenter() {
    const supabase = createClient()
    const { activeBusinessId } = useBusiness()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const [userId, setUserId] = useState<string | null>(null)

    const fetchNotifications = async () => {
        if (!activeBusinessId) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('business_id', activeBusinessId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchNotifications()

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `business_id=eq.${activeBusinessId}`
            }, (payload) => {
                const newNotif = payload.new as Notification
                // Filter out notifications not meant for this user
                // meaningful because realtime sends strictly row payloads, and we must ensure it matches our current user
                // Note: We need the current userId ref or state. Since this effect runs on activeBusinessId change, 
                // and fetchNotifications sets userId, we might have a race condition if we rely on state directly in closure.
                // However, seeing as we can't easily access the fresh state in this closure without dependency, 
                // we will rely on the fact that fetchNotifications is called first. 
                // ACTUALLY better to fetch user inside the callback if needed? No, too slow.
                // Best approach: Use a ref for userId or check against payload.new.user_id using supabase.auth.getUser() is async.

                // Let's assume we can use a functional update or a ref.
                // Let's use the helper to get user purely for the check if we don't trust the state closure.
                // But simpler: just add userId to dependency array? No, that restarts subscription.

                // We'll trust that by the time an event comes, we likely have the user. 
                // But to be safe, let's just get the user from auth in the callback. it's cheap enough (cached usually).
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && newNotif.user_id === user.id) {
                        setNotifications(prev => [newNotif, ...prev.slice(0, 19)])
                        setUnreadCount(prev => prev + 1)
                    }
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeBusinessId])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const markAsRead = async (id?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (id) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('business_id', activeBusinessId)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'SALE': return <FileText className="h-3.5 w-3.5 text-blue-500" />
            case 'PURCHASE': return <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
            case 'STOCK': return <Package className="h-3.5 w-3.5 text-rose-500" />
            case 'TEAM': return <Users className="h-3.5 w-3.5 text-[var(--primary-green)]" />
            default: return <Bell className="h-3.5 w-3.5 text-slate-500" />
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isOpen ? "bg-[var(--primary-green)]/10 text-[var(--primary-green)]" : "hover:bg-black/5 text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]"
                )}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed sm:absolute top-20 sm:top-full right-4 sm:right-0 w-[calc(100vw-32px)] sm:w-80 glass rounded-[24px] border border-white/40 shadow-2xl z-[100] overflow-hidden"
                    >
                        <div className="px-5 py-4 border-b border-white/10 bg-white/40 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm lg:text-xs font-bold text-[var(--deep-contrast)]">Alert Center</h3>
                                <p className="text-[9px] lg:text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-1">Activities & Updates</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAsRead()}
                                    className="p-1.5 rounded-lg hover:bg-[var(--primary-green)]/10 text-[var(--primary-green)] transition-all group"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-10 flex flex-col items-center justify-center space-y-2 opacity-20">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Syncing...</span>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={clsx(
                                                "p-4 hover:bg-white/40 transition-all cursor-pointer relative group",
                                                !notif.is_read && "bg-[var(--primary-green)]/5"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={clsx(
                                                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-white/40 shadow-sm",
                                                    !notif.is_read ? "bg-white shadow-md" : "bg-white/20"
                                                )}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="min-w-0 pr-4">
                                                    <p className={clsx(
                                                        "text-[11px] font-bold leading-tight",
                                                        !notif.is_read ? "text-[var(--deep-contrast)]" : "text-[var(--foreground)]/60"
                                                    )}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-[var(--foreground)]/20 uppercase tracking-tighter mt-1.5">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--primary-green)]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-16 flex flex-col items-center justify-center text-center space-y-3 opacity-20">
                                    <Bell className="h-10 w-10" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No Alerts Yet</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/10 bg-white/20 text-center">
                                <button className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)] transition-colors">
                                    View Detailed History
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
