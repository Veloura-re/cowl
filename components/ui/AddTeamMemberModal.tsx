'use client'

import { useState } from 'react'
import { Search, Shield, Loader2, Mail, Check, X, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import ErrorModal from '@/components/ui/ErrorModal'
import { motion, AnimatePresence } from 'framer-motion'

const ROLES = [
    { id: 'ADMIN', label: 'ADMIN', subLabel: 'Full access to manage business & team' },
    { id: 'PARTNER', label: 'PARTNER', subLabel: 'Co-owner access with critical permissions' },
    { id: 'STAFF', label: 'STAFF', subLabel: 'Read/Write access for sales & stock' },
    { id: 'VIEWER', label: 'VIEWER', subLabel: 'Read-only access to all records' },
]

interface AddTeamMemberModalProps {
    isOpen: boolean
    onClose: () => void
    businessId: string | null
    onSuccess: () => void
}

export default function AddTeamMemberModal({ isOpen, onClose, businessId, onSuccess }: AddTeamMemberModalProps) {
    const supabase = createClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'email' | 'username'>('email')
    const [searching, setSearching] = useState(false)
    const [foundUser, setFoundUser] = useState<any>(null)
    const [selectedRole, setSelectedRole] = useState('STAFF')
    const [isRolePickerOpen, setIsRolePickerOpen] = useState(false)
    const [addingMember, setAddingMember] = useState(false)
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        if (searchMode === 'email' && !searchQuery.includes('@')) {
            return setErrorModal({ open: true, message: 'Please enter a valid email address.' })
        }

        setSearching(true)
        setFoundUser(null)
        try {
            let query = supabase.from('profiles').select('*')

            if (searchMode === 'email') {
                query = query.eq('email', searchQuery.trim().toLowerCase())
            } else {
                query = query.eq('username', searchQuery.trim().toLowerCase())
            }

            const { data, error } = await query.single()

            if (error) {
                if (error.code === 'PGRST116') {
                    setErrorModal({
                        open: true,
                        message: searchMode === 'email'
                            ? 'User not found. They must have an account first.'
                            : 'Username not found. Check the spelling.'
                    })
                } else throw error
            } else {
                // Check if user is already a member
                const { data: memberData } = await supabase
                    .from('business_members')
                    .select('id')
                    .eq('business_id', businessId)
                    .eq('user_id', data.id)
                    .maybeSingle()

                if (memberData) {
                    setErrorModal({ open: true, message: 'This user is already a member of your team.' })
                } else {
                    setFoundUser(data)
                }
            }
        } catch (error: any) {
            setErrorModal({ open: true, message: 'Operation failed: ' + error.message })
        } finally {
            setSearching(false)
        }
    }

    const handleAddMember = async () => {
        if (!foundUser) return setErrorModal({ open: true, message: 'No user selected to add.' })
        if (!businessId) return setErrorModal({ open: true, message: 'No active business identified. Please refresh.' })

        setAddingMember(true)
        try {
            const { error } = await supabase
                .from('business_members')
                .insert({
                    business_id: businessId,
                    user_id: foundUser.id,
                    role: selectedRole.trim().toUpperCase()
                })

            if (error) throw error

            setFoundUser(null)
            setSearchQuery('')
            onSuccess()
            onClose()
            // Success feedback is handled by modal closing and list updating
        } catch (error: any) {
            setErrorModal({ open: true, message: 'Failed to add member: ' + error.message })
        } finally {
            setAddingMember(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md glass rounded-[32px] border border-white/40 shadow-2xl overflow-hidden bg-white/80"
            >
                <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl bg-[var(--primary-green)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary-green)]/20">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[var(--deep-contrast)] tracking-tight">Invite Member</h3>
                            <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider leading-none">Add by email or username</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-1 p-1 bg-white border border-black/5 rounded-2xl w-fit shadow-sm">
                            <button
                                onClick={() => setSearchMode('email')}
                                className={clsx(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    searchMode === 'email' ? "bg-[var(--deep-contrast)] text-white shadow-md shadow-black/10" : "text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]"
                                )}
                            >
                                Email
                            </button>
                            <button
                                onClick={() => setSearchMode('username')}
                                className={clsx(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    searchMode === 'username' ? "bg-[var(--deep-contrast)] text-white shadow-md shadow-black/10" : "text-[var(--foreground)]/40 hover:text-[var(--deep-contrast)]"
                                )}
                            >
                                Username
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                {searchMode === 'email' ? (
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/30 group-focus-within:text-[var(--primary-green)] transition-colors" />
                                ) : (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/30 font-black text-sm group-focus-within:text-[var(--primary-green)] transition-colors">@</span>
                                )}
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchMode === 'email' ? "Enter member's email..." : "Enter username..."}
                                    className="w-full h-12 rounded-[20px] bg-white border border-black/5 pl-11 pr-4 text-xs font-bold text-[var(--deep-contrast)] focus:border-[var(--primary-green)] focus:ring-4 focus:ring-[var(--primary-green)]/10 focus:outline-none transition-all shadow-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searching || !searchQuery.trim()}
                                className="px-6 h-12 rounded-[20px] bg-[var(--deep-contrast)] text-white font-black text-[10px] uppercase tracking-wider hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Find
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {foundUser && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-5 rounded-[24px] bg-[var(--primary-green)]/5 border border-[var(--primary-green)]/10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white border border-[var(--primary-green)]/20 flex items-center justify-center text-[var(--primary-green)] font-black text-xl shadow-sm overflow-hidden">
                                        {foundUser.avatar_url ? (
                                            <img src={foundUser.avatar_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            foundUser.full_name?.charAt(0).toUpperCase() || foundUser.email.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-[var(--deep-contrast)] truncate">{foundUser.full_name || 'System User'}</p>
                                        <p className="text-[10px] font-bold text-[var(--foreground)]/50 lowercase tracking-tight">
                                            {foundUser.username ? `@${foundUser.username}` : foundUser.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--foreground)]/40 ml-1">Assign Business Role</label>
                                        <button
                                            onClick={() => setIsRolePickerOpen(true)}
                                            className="w-full h-12 rounded-[18px] bg-white border border-black/5 px-5 text-xs font-bold text-[var(--deep-contrast)] flex items-center justify-between hover:border-[var(--primary-green)] transition-all shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-[var(--primary-green)] opacity-50" />
                                                <span>{selectedRole}</span>
                                            </div>
                                            <div className="text-[10px] opacity-40">Change</div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddMember}
                                        disabled={addingMember}
                                        className="w-full h-14 rounded-2xl bg-[var(--primary-green)] text-white font-black text-[12px] uppercase tracking-[0.1em] hover:bg-[var(--deep-contrast)] transition-all shadow-xl shadow-[var(--primary-green)]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {addingMember ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                        Add to Team
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <PickerModal
                    isOpen={isRolePickerOpen}
                    onClose={() => setIsRolePickerOpen(false)}
                    onSelect={(role) => {
                        setSelectedRole(role)
                        setIsRolePickerOpen(false)
                    }}
                    title="Select Member Role"
                    options={ROLES}
                    selectedValue={selectedRole}
                />

                <ErrorModal
                    isOpen={errorModal.open}
                    onClose={() => setErrorModal({ ...errorModal, open: false })}
                    message={errorModal.message}
                />
            </motion.div>
        </div>
    )
}
