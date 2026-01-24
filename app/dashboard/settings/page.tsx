'use client'

import { useState, useEffect } from 'react'
import { Building, Lock, Loader2, Globe, Shield, Bell, ChevronDown, LogOut, User, Wallet, X, Users, ChevronRight, Moon, Sparkles, Building2, UserPlus, Plus, Save } from 'lucide-react'
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24 text-[var(--foreground)]/20">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="pb-3 border-b border-[var(--primary-green)]/10">
                <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">Configuration</h1>
                <p className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] leading-none mt-1">Platform Control Center</p>
            </div>

            <div className="grid gap-3">
                {/* Interface Control */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-[var(--foreground)]/5 text-[var(--deep-contrast)] flex items-center justify-center shadow-inner">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Interface</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">App Theme Logic</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Account Metadata */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-[var(--primary-green)]/10 text-[var(--primary-green)] flex items-center justify-center shadow-inner">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Personal Identity</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Account Master Data</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-[var(--foreground)]/20 uppercase tracking-[0.3em]">SECURE ACCESS</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Identity Label</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Universal Handle</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/20 font-black text-[11px]">@</span>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 pl-9 pr-4 text-[11px] font-black text-[var(--primary-green)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                    placeholder="handle"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Organization Data */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/20">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Organization Profile</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Enterprise Registry</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSwitcherOpen(true)}
                                className="px-3 py-1.5 rounded-xl bg-[var(--foreground)]/10 border border-[var(--foreground)]/5 text-[9px] font-black uppercase tracking-widest text-[var(--deep-contrast)] hover:bg-[var(--foreground)]/20 transition-all active:scale-95 shadow-sm"
                            >
                                SWITCH
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--deep-contrast)] text-[var(--primary-foreground)] shadow-xl shadow-[var(--deep-contrast)]/20 active:scale-95 transition-all hover:bg-[var(--primary-green)]"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Entity Label</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Registry Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1 flex items-center gap-2">
                                    <Globe className="h-2.5 w-2.5" /> Fiscal Currency
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCurrencyPickerOpen(true)}
                                    className="w-full h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                                >
                                    <span className="truncate">
                                        {currencies.find(c => c.code === formData.currency)?.symbol} - {formData.currency}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-20" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--foreground)]/40 mb-2 ml-1">Registry Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full h-24 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner resize-none"
                                placeholder="Operational locus..."
                            />
                        </div>

                        <div className="flex justify-end pt-3 border-t border-[var(--foreground)]/5">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary-green)] text-[var(--primary-foreground)] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Commit Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ledger Config */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Financial Rails</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Payment Liquidation Modes</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-[var(--foreground)]/20 uppercase tracking-[0.3em]">REVENUE CHANNELS</span>
                    </div>

                    <div className="p-5 space-y-5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newModeName}
                                onChange={(e) => setNewModeName(e.target.value.toUpperCase())}
                                placeholder="E.G. M-PESA, STRIPE..."
                                className="flex-1 h-11 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-black text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner uppercase"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMode()}
                            />
                            <button
                                onClick={handleAddMode}
                                disabled={addingMode || !newModeName.trim()}
                                className="px-6 h-11 rounded-xl bg-[var(--deep-contrast)] text-[var(--deep-contrast-foreground)] font-black text-[10px] uppercase tracking-widest hover:bg-[var(--deep-contrast-hover)] transition-all shadow-xl active:scale-95 disabled:opacity-40"
                            >
                                {addingMode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'REGISTER'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {paymentModes.map((mode) => (
                                <div
                                    key={mode.id}
                                    className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 hover:border-[var(--primary-green)]/30 transition-all shadow-sm"
                                >
                                    <span className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-widest">{mode.name}</span>
                                    <button
                                        onClick={() => handleDeleteMode(mode.id)}
                                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Secure Access Control */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/20">
                                <Lock className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Secure Access</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Authorization Controls</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 hover:border-[var(--primary-green)]/20 transition-all cursor-pointer group" onClick={() => setIsChangePasswordModalOpen(true)}>
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-orange-600/40 group-hover:text-orange-600 transition-colors" />
                                <div>
                                    <p className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Cryptographic Key</p>
                                    <p className="text-[8px] font-black text-[var(--foreground)]/30 uppercase tracking-widest mt-0.5">Mandatory security cycle</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[var(--foreground)]/20 group-hover:text-[var(--deep-contrast)] transition-all" />
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/dashboard/settings/team"
                                className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 hover:border-blue-500/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-blue-500/40 group-hover:text-blue-500 transition-colors" />
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Network Consortium</p>
                                        <p className="text-[8px] font-black text-[var(--foreground)]/30 uppercase tracking-widest mt-0.5">Collaborative access</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-[var(--foreground)]/20 group-hover:text-[var(--deep-contrast)] transition-all" />
                            </Link>
                            <button
                                onClick={() => setIsAddTeamModalOpen(true)}
                                className="w-14 rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center"
                                title="Invite New Node"
                            >
                                <UserPlus className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="pt-3 border-t border-[var(--foreground)]/5">
                            <button
                                onClick={handleSignOut}
                                className="w-full h-11 flex items-center justify-between px-5 rounded-xl bg-orange-600/5 text-orange-600/40 border border-orange-600/10 hover:bg-orange-600 hover:text-white transition-all active:scale-[0.99] group shadow-inner"
                            >
                                <span className="text-[9px] font-black uppercase tracking-[0.3em]">DE-AUTHORIZE SESSION</span>
                                <LogOut className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alert Configuration */}
                <div className="glass rounded-[24px] border border-[var(--foreground)]/10 overflow-hidden shadow-lg">
                    <div className="px-5 py-3.5 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-inner">
                                <Bell className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight">Signal Matrix</h3>
                                <p className="text-[8px] font-black text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">Notification Routing</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'notify_sales', label: 'Fiscal Inbound', desc: 'Realtime Sales Data' },
                                { id: 'notify_purchases', label: 'Fiscal Outbound', desc: 'Registry Expenditures' },
                                { id: 'notify_stock', label: 'Asset Alert', desc: 'Critical stock levels' },
                                { id: 'notify_team', label: 'Node Activity', desc: 'Network changes' },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 shadow-sm">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-widest truncate">{item.label}</p>
                                        <p className="text-[7px] font-black text-[var(--foreground)]/30 uppercase mt-0.5 truncate">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateNotifSetting(item.id as any, !notifSettings[item.id as keyof typeof notifSettings])}
                                        disabled={updatingNotif === item.id}
                                        className={clsx(
                                            "w-10 h-6 rounded-full p-1 transition-all duration-300 relative shadow-inner",
                                            notifSettings[item.id as keyof typeof notifSettings] ? "bg-[var(--primary-green)]" : "bg-[var(--foreground)]/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "h-4 w-4 rounded-full bg-white shadow-lg transition-all duration-300 transform",
                                            notifSettings[item.id as keyof typeof notifSettings] ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Modals */}
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
