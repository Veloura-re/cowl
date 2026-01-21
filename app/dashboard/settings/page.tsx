'use client'

import { useState, useEffect } from 'react'
import { Building, Lock, Loader2, Globe, Shield, Bell, ChevronDown, LogOut, User, Wallet, X, Users, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { currencies } from '@/lib/currencies'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import { useBusiness } from '@/context/business-context'
import CreateBusinessModal from '@/components/ui/CreateBusinessModal'
import { Plus, Building2, UserPlus } from 'lucide-react'
import AddTeamMemberModal from '@/components/ui/AddTeamMemberModal'
import FeedbackModal from '@/components/ui/FeedbackModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ChangePasswordModal from '@/components/ui/ChangePasswordModal'

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
                        const { data: bus, error: busError } = await supabase
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

                        // Fetch Payment Modes
                        const { data: modes } = await supabase
                            .from('payment_modes')
                            .select('*')
                            .eq('business_id', activeBusinessId)
                            .order('created_at')

                        if (modes) setPaymentModes(modes)

                        // Fetch Notification Settings
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
                        // No active business, just set profile info
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
            console.error('Sign out error:', error)
            window.location.href = '/login'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 text-[var(--foreground)]/50">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 max-w-3xl mx-auto">
            <div className="pb-3 border-b border-[var(--primary-green)]/10">
                <h1 className="text-xl font-bold text-[var(--deep-contrast)] tracking-tight">Settings</h1>
                <p className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Manage your business & account</p>
            </div>

            <div className="grid gap-3">
                {/* Personal Profile - NEW */}
                <div className="glass rounded-2xl border border-white/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/20 bg-white/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[var(--primary-green)]/10 text-[var(--primary-green)] flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                            <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Personal Profile</h3>
                        </div>
                        <span className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Account Metadata</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full h-9 rounded-xl bg-white/50 border border-white/20 px-3 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 ml-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/30 font-bold text-xs">@</span>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    className="w-full h-9 rounded-xl bg-white/50 border border-white/20 pl-7 pr-3 text-xs font-bold text-[var(--primary-green)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Business Profile - Ultra Compact */}
                <div className="glass rounded-2xl border border-white/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/20 bg-white/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[var(--primary-green)] text-white flex items-center justify-center shadow-sm">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Business Profile</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSwitcherOpen(true)}
                                className="px-3 py-1.5 rounded-xl bg-white/40 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-[var(--deep-contrast)] hover:bg-white/60 transition-all active:scale-95"
                            >
                                Switch
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="p-1.5 rounded-xl bg-[var(--deep-contrast)] text-white shadow-lg shadow-[var(--deep-contrast)]/10 active:scale-95 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <PickerModal
                        isOpen={isSwitcherOpen}
                        onClose={() => setIsSwitcherOpen(false)}
                        onSelect={(id) => {
                            setActiveBusinessId(id)
                            setIsSwitcherOpen(false)
                        }}
                        title="Select Business"
                        options={businesses.map(b => ({
                            id: b.id,
                            label: b.name.toUpperCase(),
                            subLabel: b.isOwner ? 'OWNER' : 'JOINED TEAM'
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

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1">Business Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-9 rounded-xl bg-white/50 border border-white/20 px-3 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-9 rounded-xl bg-white/50 border border-white/20 px-3 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1 flex items-center gap-1.5">
                                    <Globe className="h-2.5 w-2.5" /> Business Currency
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCurrencyPickerOpen(true)}
                                    className="w-full h-9 rounded-xl bg-white/50 border border-white/20 px-3 text-xs font-bold text-[var(--deep-contrast)] hover:border-[var(--primary-green)] transition-all flex items-center justify-between shadow-inner"
                                >
                                    <span className="truncate">
                                        {currencies.find(c => c.code === formData.currency)?.symbol} - {currencies.find(c => c.code === formData.currency)?.name} ({formData.currency})
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-20" />
                                </button>
                                <PickerModal
                                    isOpen={isCurrencyPickerOpen}
                                    onClose={() => setIsCurrencyPickerOpen(false)}
                                    onSelect={(currency) => setFormData({ ...formData, currency })}
                                    title="Select Currency"
                                    options={currencies.map(c => ({
                                        id: c.code,
                                        label: `${c.symbol} - ${c.code}`,
                                        subLabel: c.name
                                    }))}
                                    selectedValue={formData.currency}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-1.5 ml-1">Business Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full min-h-[60px] rounded-xl bg-white/50 border border-white/20 p-3 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-1 focus:ring-[var(--primary-green)]/20 focus:outline-none transition-all shadow-inner resize-none"
                                placeholder="P.O. Box, Building, Street..."
                            />
                        </div>

                        <div className="flex justify-end pt-2 border-t border-[var(--primary-green)]/5">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--deep-contrast)] text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Payment Modes - NEW */}
            <div className="glass rounded-2xl border border-white/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/20 bg-white/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Payment Modes</h3>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Global Methods</span>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newModeName}
                            onChange={(e) => setNewModeName(e.target.value)}
                            placeholder="e.g. M-PESA, STRIPE..."
                            className="flex-1 h-9 rounded-xl bg-white/50 border border-white/20 px-3 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:outline-none transition-all shadow-inner uppercase"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMode()}
                        />
                        <button
                            onClick={handleAddMode}
                            disabled={addingMode || !newModeName.trim()}
                            className="px-4 h-9 rounded-xl bg-[var(--deep-contrast)] text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {addingMode ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {paymentModes.length === 0 && (
                            <p className="col-span-full text-[9px] font-bold text-[var(--foreground)]/30 uppercase text-center py-4">No custom modes added</p>
                        )}
                        {paymentModes.map((mode) => (
                            <div
                                key={mode.id}
                                className="group relative flex items-center justify-between px-3 py-2 rounded-xl bg-white/30 border border-white/10 hover:bg-white/50 transition-all"
                            >
                                <span className="text-[10px] font-bold text-[var(--deep-contrast)] tracking-wider">{mode.name}</span>
                                <button
                                    onClick={() => handleDeleteMode(mode.id)}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-black/5">
                        <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-relaxed">
                            Note: Default modes (CASH, BANK, ONLINE) are always available.
                        </p>
                    </div>
                </div>
            </div>

            {/* Account Security - Compact */}
            <div className="glass rounded-2xl border border-white/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/20 bg-white/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Lock className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Security</h3>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Access Control</span>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-[var(--foreground)]/30" />
                            <div>
                                <p className="text-xs font-bold text-[var(--deep-contrast)]">Password</p>
                                <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Update your login credentials</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChangePasswordModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl border border-[var(--primary-green)]/20 hover:bg-[var(--primary-green)] hover:text-white text-[10px] font-bold uppercase tracking-wider text-[var(--deep-contrast)] transition-all"
                        >
                            Change
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/settings/team"
                            className="flex-1 flex items-center justify-between p-3 rounded-xl bg-white/30 border border-white/10 hover:bg-white/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-blue-500" />
                                <div>
                                    <p className="text-xs font-bold text-[var(--deep-contrast)]">Team Management</p>
                                    <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Manage partners & viewers</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[var(--foreground)]/20 group-hover:text-[var(--deep-contrast)] transition-colors" />
                        </Link>
                        <button
                            onClick={() => setIsAddTeamModalOpen(true)}
                            className="p-4 rounded-xl bg-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/10 hover:bg-[var(--deep-contrast)] transition-all active:scale-95 flex items-center justify-center"
                            title="Quick Invite Member"
                        >
                            <UserPlus className="h-5 w-5" />
                        </button>
                    </div>

                    <AddTeamMemberModal
                        isOpen={isAddTeamModalOpen}
                        onClose={() => setIsAddTeamModalOpen(false)}
                        businessId={activeBusinessId}
                        onSuccess={() => router.refresh()}
                    />

                    <div className="pt-3 border-t border-[var(--primary-green)]/5">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-rose-600/60 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-600 hover:text-white transition-all active:scale-95 group"
                        >
                            <span className="uppercase tracking-wider">Terminate Session</span>
                            <LogOut className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications - Small Section */}
            <div className="glass rounded-2xl border border-white/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/20 bg-white/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Bell className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Notifications</h3>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">Alert Settings</span>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { id: 'notify_sales', label: 'Sales Alerts', desc: 'New sale transactions' },
                            { id: 'notify_purchases', label: 'Purchase Alerts', desc: 'New stock purchases' },
                            { id: 'notify_stock', label: 'Low Stock Alerts', desc: 'When items hit minimum stock' },
                            { id: 'notify_team', label: 'Team Activity', desc: 'Membership changes' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/30 border border-white/10">
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--deep-contrast)] uppercase tracking-tight">{item.label}</p>
                                    <p className="text-[8px] font-bold text-[var(--foreground)]/40">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => handleUpdateNotifSetting(item.id as any, !notifSettings[item.id as keyof typeof notifSettings])}
                                    disabled={updatingNotif === item.id}
                                    className={clsx(
                                        "w-9 h-5 rounded-full p-1 transition-all duration-300 relative",
                                        notifSettings[item.id as keyof typeof notifSettings] ? "bg-[var(--primary-green)] shadow-inner" : "bg-black/10"
                                    )}
                                >
                                    <div className={clsx(
                                        "h-3 w-3 rounded-full bg-white shadow-md transition-all duration-300 transform",
                                        notifSettings[item.id as keyof typeof notifSettings] ? "translate-x-4" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2 border-t border-black/5">
                        <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-relaxed">
                            Team members set their own notification preferences.
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeDeleteMode(confirmModal.modeId)}
                isLoading={deletingMode}
                title="Delete Mode?"
                message="This payment mode will no longer be available for new transactions."
                confirmText="Delete"
                cancelText="Keep"
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
