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
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission)
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(setPermission)
            }
        }
    }, [])

    const sendBrowserNotification = (notif: Notification) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const n = new window.Notification(notif.title, {
                body: notif.message,
                icon: '/logo.png',
                tag: notif.id // Prevent duplicates
            })
            n.onclick = () => {
                window.focus()
                setIsOpen(true)
                n.close()
            }
        }
    }

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
                        sendBrowserNotification(newNotif)
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
            default: return <Bell className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isOpen ? "bg-[var(--primary-green)]/10 text-[var(--primary-green)]" : "hover:bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]"
                )}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-[var(--background)] animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-[var(--modal-backdrop)] backdrop-blur-sm z-[100]"
                        />

                        {/* Modal Container */}
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-[110] pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-full max-w-sm bg-[var(--background)] rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto border border-[var(--foreground)]/5"
                            >
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-[var(--foreground)]/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-[var(--deep-contrast)]">Alert Center</h3>
                                        <p className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest leading-none mt-1">Activities & Updates</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 pr-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => markAsRead()}
                                                className="h-10 px-4 rounded-2xl hover:bg-emerald-500/10 text-emerald-600 transition-all group flex items-center gap-2 active:scale-95 border border-transparent hover:border-emerald-500/20"
                                                title="Mark all as read"
                                            >
                                                <CheckCheck className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Flush All</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-[var(--foreground)]/5 text-[var(--foreground)]/40 transition-all active:scale-95 border border-transparent hover:border-[var(--foreground)]/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[var(--background)]">
                                    {loading ? (
                                        <div className="p-12 flex flex-col items-center justify-center space-y-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/20">Syncing...</span>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => markAsRead(notif.id)}
                                                    className={clsx(
                                                        "p-5 hover:bg-[var(--foreground)]/5 transition-all cursor-pointer relative group",
                                                        !notif.is_read && "bg-emerald-500/5"
                                                    )}
                                                >
                                                    <div className="flex gap-4">
                                                        <div className={clsx(
                                                            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--foreground)]/5 transition-all",
                                                            !notif.is_read ? "bg-[var(--background)] shadow-lg shadow-emerald-900/5 rotate-3" : "bg-[var(--foreground)]/5"
                                                        )}>
                                                            {getIcon(notif.type)}
                                                        </div>
                                                        <div className="min-w-0 flex-1 pr-4">
                                                            <p className={clsx(
                                                                "text-[12px] font-bold leading-tight",
                                                                !notif.is_read ? "text-[var(--deep-contrast)]" : "text-[var(--foreground)]/60"
                                                            )}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[11px] text-[var(--foreground)]/40 mt-1 line-clamp-2 leading-relaxed font-medium">
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <p className="text-[9px] font-bold text-[var(--foreground)]/20 uppercase tracking-tight">
                                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                                </p>
                                                                {!notif.is_read && (
                                                                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="h-16 w-16 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center text-[var(--foreground)]/20">
                                                <Bell className="h-8 w-8" />
                                            </div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--foreground)]/20">No Alerts Yet</p>
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="p-4 border-t border-[var(--foreground)]/5 bg-[var(--background)]">
                                        <button className="w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--deep-contrast)] transition-all">
                                            View Detailed History
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
