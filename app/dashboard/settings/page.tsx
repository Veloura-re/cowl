'use client'

import { useState, useEffect } from 'react'
import { Building, Lock, Loader2, Globe, Shield, Bell, ChevronDown, LogOut, User, Wallet, X, Users, ChevronRight, Moon, Sparkles, Building2, UserPlus, Plus, Save, Database, Upload, Download, Key } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { currencies } from '@/lib/currencies'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import { useBusiness } from '@/context/business-context'
import CreateBusinessModal from '@/components/ui/CreateBusinessModal'
import AddTeamMemberModal from '@/components/ui/AddTeamMemberModal'
import FeedbackModal from '@/components/ui/FeedbackModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ChangePasswordModal from '@/components/ui/ChangePasswordModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { exportBusinessData, importBusinessData } from '@/utils/backup-service'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false)
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false)
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
    const [business, setBusiness] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        currency: 'KES',
        fullName: '',
        username: ''
    })
    const [paymentModes, setPaymentModes] = useState<any[]>([])
    const [newModeName, setNewModeName] = useState('')
    const [addingMode, setAddingMode] = useState(false)
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean, message: string, variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' })
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, modeId: string }>({ open: false, modeId: '' })
    const [deletingMode, setDeletingMode] = useState(false)
    const [notifSettings, setNotifSettings] = useState({
        notify_sales: true,
        notify_purchases: true,
        notify_stock: true,
        notify_team: true
    })
    const [updatingNotif, setUpdatingNotif] = useState<string | null>(null)
    const [isBackupLoading, setIsBackupLoading] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)

    const { activeBusinessId, businesses, setActiveBusinessId, refreshBusinesses } = useBusiness()

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (activeBusinessId) {
                        const { data: bus } = await supabase
                            .from('businesses')
                            .select('*')
                            .eq('id', activeBusinessId)
                            .single()

                        if (bus) {
                            setBusiness(bus)
                            setFormData(prev => ({
                                ...prev,
                                name: bus.name || '',
                                phone: bus.phone || '',
                                address: bus.address || '',
                                currency: bus.currency || 'KES',
                                fullName: profile?.full_name || '',
                                username: profile?.username || ''
                            }))
                        }

                        const { data: modes } = await supabase
                            .from('payment_modes')
                            .select('*')
                            .eq('business_id', activeBusinessId)
                            .order('created_at')

                        if (modes) setPaymentModes(modes)

                        const { data: ns } = await supabase
                            .from('notification_settings')
                            .select('*')
                            .eq('business_id', activeBusinessId)
                            .eq('user_id', user.id)
                            .single()

                        if (ns) {
                            setNotifSettings({
                                notify_sales: ns.notify_sales,
                                notify_purchases: ns.notify_purchases,
                                notify_stock: ns.notify_stock,
                                notify_team: ns.notify_team
                            })
                        }
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            fullName: profile?.full_name || '',
                            username: profile?.username || ''
                        }))
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [activeBusinessId])

    const handleSave = async () => {
        if (!business || !activeBusinessId) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    currency: formData.currency,
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                })
                .eq('id', activeBusinessId)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.fullName,
                        username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    })
                    .eq('id', user.id)
            }

            if (error) throw error
            await refreshBusinesses()
            router.refresh()
            setFeedbackModal({ open: true, message: 'Settings saved successfully!', variant: 'success' })
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Failed to save settings: ' + error.message, variant: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const handleAddMode = async () => {
        if (!newModeName.trim() || !activeBusinessId) return
        setAddingMode(true)
        try {
            const { data, error } = await supabase
                .from('payment_modes')
                .insert({
                    business_id: activeBusinessId,
                    name: newModeName.trim().toUpperCase()
                })
                .select()
                .single()

            if (error) throw error
            setPaymentModes([...paymentModes, data])
            setNewModeName('')
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Failed to add payment mode: ' + error.message, variant: 'error' })
        } finally {
            setAddingMode(false)
        }
    }

    const handleDeleteMode = async (id: string) => {
        setConfirmModal({ open: true, modeId: id })
    }

    const executeDeleteMode = async (id: string) => {
        setDeletingMode(true)
        try {
            const { error } = await supabase
                .from('payment_modes')
                .delete()
                .eq('id', id)

            if (error) throw error
            setPaymentModes(paymentModes.filter(m => m.id !== id))
            setConfirmModal({ open: false, modeId: '' })
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Failed to delete payment mode: ' + error.message, variant: 'error' })
        } finally {
            setDeletingMode(false)
        }
    }

    const handleUpdateNotifSetting = async (key: keyof typeof notifSettings, value: boolean) => {
        if (!activeBusinessId) return
        setUpdatingNotif(key)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('notification_settings')
                .update({ [key]: value })
                .eq('business_id', activeBusinessId)
                .eq('user_id', user.id)

            if (error) throw error
            setNotifSettings(prev => ({ ...prev, [key]: value }))
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Failed to update notification settings: ' + error.message, variant: 'error' })
        } finally {
            setUpdatingNotif(null)
        }
    }

    const handleSignOut = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut()
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/login'
        } catch (error: any) {
            window.location.href = '/login'
        }
    }

    const handleBackup = async () => {
        if (!activeBusinessId) return
        setIsBackupLoading(true)
        try {
            await exportBusinessData(supabase, activeBusinessId)
            setFeedbackModal({ open: true, message: 'Backup downloaded successfully.', variant: 'success' })
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Backup failed: ' + error.message, variant: 'error' })
        } finally {
            setIsBackupLoading(false)
        }
    }

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeBusinessId) return

        setIsRestoring(true)
        try {
            const success = await importBusinessData(supabase, file, activeBusinessId)
            if (success) {
                setFeedbackModal({ open: true, message: 'Data restored successfully! Refreshing...', variant: 'success' })
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            }
        } catch (error: any) {
            setFeedbackModal({ open: true, message: 'Restore failed: ' + error.message, variant: 'error' })
        } finally {
            setIsRestoring(false)
            // Reset input
            e.target.value = ''
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24 text-[var(--foreground)]/20">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    /**
     * Reusable Card Component for Bento Grid
     */
    const BentoCard = ({ children, className, title, icon: Icon, subtitle, action }: any) => (
        <div className={clsx("glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg flex flex-col", className)}>
            {(title || Icon) && (
                <div className="px-4 py-3 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/3 flex items-center justify-between min-h-[50px]">
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <div className="h-7 w-7 rounded-lg bg-[var(--foreground)]/5 text-[var(--deep-contrast)] flex items-center justify-center shadow-inner">
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                        )}
                        <div>
                            {title && <h3 className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">{title}</h3>}
                            {subtitle && <p className="text-[7px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-4 flex-1">
                {children}
            </div>
        </div>
    )

    return (
        <div className="space-y-4 pb-20 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--primary-green)]/10">
                <div>
                    <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">System Control</h1>
                    <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] leading-none mt-1">Registry Configuration</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-[var(--deep-contrast-hover)] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save All
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="h-9 px-4 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                        title="Sign Out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* 1. ORGANIZATION (Wide Main) */}
                <BentoCard
                    title="Active Registry"
                    subtitle="Organizational Master Data"
                    icon={Building2}
                    className="md:col-span-2 md:row-span-2"
                    action={
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSwitcherOpen(true)} className="px-2 py-1 rounded-lg bg-[var(--foreground)]/10 text-[8px] font-black uppercase tracking-wider hover:bg-[var(--foreground)]/20 transition-all">Switch</button>
                            <button onClick={() => setIsCreateModalOpen(true)} className="h-6 w-6 rounded-lg bg-[var(--primary-green)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)]"><Plus size={12} /></button>
                        </div>
                    }
                >
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1.5 ml-1">Entity Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1.5 ml-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1.5 ml-1 flex items-center gap-1"><Globe size={10} /> Currency</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCurrencyPickerOpen(true)}
                                    className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all flex items-center justify-between"
                                >
                                    <span className="truncate">{currencies.find(c => c.code === formData.currency)?.symbol} - {formData.currency}</span>
                                    <ChevronDown className="h-3 w-3 opacity-30" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[80px]">
                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1.5 ml-1">Locus / Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full h-full rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </BentoCard>

                {/* 2. PERSONAL Identity */}
                <BentoCard
                    title="Operator Identity"
                    subtitle="User Profile"
                    icon={User}
                    className="md:col-span-1"
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1 ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[7px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-1 ml-1">Handle</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/20 font-black text-[9px]">@</span>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    className="w-full h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-7 pr-3 text-[10px] font-black text-[var(--primary-green)] focus:border-[var(--primary-green)] focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* 3. INTERFACE */}
                <BentoCard
                    title="Visuals"
                    subtitle="Theming"
                    icon={Sparkles}
                    className="md:col-span-1"
                >
                    <div className="flex items-center justify-between h-full">
                        <div>
                            <p className="text-[9px] font-black text-[var(--deep-contrast)] uppercase">Mode</p>
                            <p className="text-[7px] font-black text-[var(--foreground)]/30 uppercase mt-0.5">Toggle Day/Night</p>
                        </div>
                        <ThemeToggle />
                    </div>
                </BentoCard>

                {/* 4. FINANCIAL RAILS (Wide) */}
                <BentoCard
                    title="Revenue Channels"
                    subtitle="Payment Modes"
                    icon={Wallet}
                    className="md:col-span-2 md:row-span-1"
                >
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newModeName}
                                onChange={(e) => setNewModeName(e.target.value.toUpperCase())}
                                placeholder="NEW CHANNEL..."
                                className="flex-1 h-9 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 text-[10px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all uppercase"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMode()}
                            />
                            <button
                                onClick={handleAddMode}
                                disabled={addingMode || !newModeName.trim()}
                                className="px-4 h-9 rounded-lg bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] font-black text-[8px] uppercase tracking-widest hover:bg-[var(--deep-contrast-hover)] transition-all disabled:opacity-40"
                            >
                                {addingMode ? <Loader2 className="h-3 w-3 animate-spin" /> : 'ADD'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                            {paymentModes.map((mode) => (
                                <div key={mode.id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:border-[var(--primary-green)]/30 transition-all">
                                    <span className="text-[8px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">{mode.name}</span>
                                    <button onClick={() => handleDeleteMode(mode.id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-125"><X size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </BentoCard>

                {/* 5. NOTIFICATIONS */}
                <BentoCard
                    title="Signal Matrix"
                    subtitle="Notification Routing"
                    icon={Bell}
                    className="md:col-span-2 md:row-span-1"
                >
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'notify_sales', label: 'Inbound' },
                            { id: 'notify_purchases', label: 'Outbound' },
                            { id: 'notify_stock', label: 'Inventory' },
                            { id: 'notify_team', label: 'Network' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleUpdateNotifSetting(item.id as any, !notifSettings[item.id as keyof typeof notifSettings])}
                                className={clsx(
                                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-all active:scale-95 group",
                                    notifSettings[item.id as keyof typeof notifSettings]
                                        ? "bg-[var(--primary-green)]/5 border-[var(--primary-green)]/20"
                                        : "bg-[var(--foreground)]/2 border-[var(--foreground)]/5 hover:bg-[var(--foreground)]/5"
                                )}
                            >
                                <span className={clsx("text-[8px] font-black uppercase tracking-widest", notifSettings[item.id as keyof typeof notifSettings] ? "text-[var(--primary-green)]" : "text-[var(--foreground)]/50")}>{item.label}</span>
                                <div className={clsx("h-2 w-2 rounded-full transition-all", notifSettings[item.id as keyof typeof notifSettings] ? "bg-[var(--primary-green)]" : "bg-[var(--foreground)]/10")} />
                            </button>
                        ))}
                    </div>
                </BentoCard>

                {/* 6. SECURITY */}
                <BentoCard
                    title="Protocol Security"
                    subtitle="Access & Keys"
                    icon={Shield}
                    className="md:col-span-1"
                >
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsChangePasswordModalOpen(true)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <Key className="h-3.5 w-3.5 text-orange-500" />
                                <span className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Password</span>
                            </div>
                            <ChevronRight size={12} className="opacity-30 group-hover:opacity-100" />
                        </button>
                        <Link
                            href="/dashboard/settings/team"
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-wider">Team</span>
                            </div>
                            <ChevronRight size={12} className="opacity-30 group-hover:opacity-100" />
                        </Link>
                    </div>
                </BentoCard>

                {/* 7. DATA GOVERNANCE */}
                <BentoCard
                    title="Governance"
                    subtitle="Disaster Recovery"
                    icon={Database}
                    className="md:col-span-3"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center">
                        <div className="flex flex-col gap-2">
                            <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mb-1">Export</p>
                            <button
                                onClick={handleBackup}
                                disabled={isBackupLoading}
                                className="w-full h-10 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[9px] font-black uppercase tracking-widest text-[var(--deep-contrast)] hover:bg-[var(--foreground)]/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isBackupLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                Download Snapshot
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mb-1">Import</p>
                            <label className="w-full h-10 rounded-xl bg-[var(--primary-green)]/10 border border-[var(--primary-green)]/20 text-[9px] font-black uppercase tracking-widest text-[var(--primary-green)] hover:bg-[var(--primary-green)] hover:text-[var(--primary-foreground)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 relative overflow-hidden">
                                {isRestoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                <span>{isRestoring ? 'Restoring...' : 'Upload Backup'}</span>
                                <input type="file" accept=".json" onChange={handleRestore} disabled={isRestoring} className="hidden" />
                            </label>
                        </div>
                    </div>
                </BentoCard>

            </div>

            {/* Modals */}
            <PickerModal
                isOpen={isSwitcherOpen}
                onClose={() => setIsSwitcherOpen(false)}
                onSelect={(id) => {
                    setActiveBusinessId(id)
                    setIsSwitcherOpen(false)
                }}
                title="Select Deployment"
                options={businesses.map(b => ({
                    id: b.id,
                    label: b.name.toUpperCase(),
                    subLabel: b.isOwner ? 'MASTER NODE (OWNER)' : 'GUEST NODE (TEAM)'
                }))}
                selectedValue={activeBusinessId}
            />

            <CreateBusinessModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />

            <AddTeamMemberModal
                isOpen={isAddTeamModalOpen}
                onClose={() => setIsAddTeamModalOpen(false)}
                businessId={activeBusinessId}
                onSuccess={() => router.refresh()}
            />

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDeleteMode(confirmModal.modeId)}
                isLoading={deletingMode}
                title="De-register Mode?"
                message="Permanently isolate this payment channel from the active registry?"
                confirmText="De-register"
                variant="danger"
            />

            <FeedbackModal
                isOpen={feedbackModal.open}
                onClose={() => setFeedbackModal({ ...feedbackModal, open: false })}
                message={feedbackModal.message}
                variant={feedbackModal.variant}
            />
        </div>
    )
}
