'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Shield, Trash2, Loader2, ArrowLeft, ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { useBusiness } from '@/context/business-context'
import AddTeamMemberModal from '@/components/ui/AddTeamMemberModal'
import ErrorModal from '@/components/ui/ErrorModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

const ROLES = [
    { id: 'ADMIN', label: 'ADMIN', subLabel: 'Full access to manage business & team' },
    { id: 'PARTNER', label: 'PARTNER', subLabel: 'Co-owner access with critical permissions' },
    { id: 'STAFF', label: 'STAFF', subLabel: 'Read/Write access for sales & stock' },
    { id: 'VIEWER', label: 'VIEWER', subLabel: 'Read-only access to all records' },
]

export default function TeamManagementPage() {
    const supabase = createClient()
    const router = useRouter()
    const { activeBusinessId, isLoading: businessLoading } = useBusiness()

    const [loading, setLoading] = useState(true)
    const [fetchingMembers, setFetchingMembers] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [isOwner, setIsOwner] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' })
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, userId: string, action: 'remove' | 'leave' }>({ open: false, userId: '', action: 'remove' })
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')
            setCurrentUser(user)

            if (activeBusinessId) {
                fetchMembers(user.id)
            } else if (!businessLoading) {
                // If business loading is done and we still have no activeBusinessId, stop loading
                setLoading(false)
            }
        }

        if (!businessLoading) {
            checkAuth()
        }
    }, [activeBusinessId, businessLoading])

    const fetchMembers = async (currentUserId: string) => {
        if (!activeBusinessId) return
        setFetchingMembers(true)
        try {
            const { data, error } = await supabase
                .from('business_members')
                .select(`
                    *,
                    profiles(*)
                `)
                .eq('business_id', activeBusinessId)

            if (error) throw error
            setMembers(data || [])

            const myMembership = data?.find(m => m.user_id === currentUserId)
            setIsOwner(myMembership?.role === 'OWNER')
            setCurrentUserRole(myMembership?.role || '')
        } catch (error: any) {
            console.error('Error fetching members:', error)
        } finally {
            setLoading(false)
            setFetchingMembers(false)
        }
    }

    const handleUpdateRole = async (memberUserId: string, newRole: string) => {
        if (!isOwner) return
        try {
            const { error } = await supabase
                .from('business_members')
                .update({ role: newRole })
                .eq('business_id', activeBusinessId)
                .eq('user_id', memberUserId)

            if (error) throw error
            fetchMembers(currentUser.id)
        } catch (error: any) {
            setErrorModal({ open: true, message: 'Failed to update role: ' + error.message })
        }
    }

    const handleRemoveMember = async (memberUserId: string) => {
        if (!isOwner) return
        setConfirmModal({ open: true, userId: memberUserId, action: 'remove' })
    }

    const handleLeaveTeam = () => {
        const canLeave = ['PARTNER', 'STAFF', 'VIEWER'].includes(currentUserRole)
        if (!canLeave) return // Only partners, staff, and viewers can leave
        setConfirmModal({ open: true, userId: currentUser?.id, action: 'leave' })
    }

    const executeRemoveMember = async (memberUserId: string) => {
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('business_members')
                .delete()
                .eq('business_id', activeBusinessId)
                .eq('user_id', memberUserId)

            if (error) throw error
            setConfirmModal({ ...confirmModal, open: false })

            // If leaving, redirect to dashboard
            if (confirmModal.action === 'leave') {
                router.push('/dashboard')
                router.refresh()
            } else {
                fetchMembers(currentUser.id)
            }
        } catch (error: any) {
            setErrorModal({ open: true, message: 'Failed to remove member: ' + error.message })
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 text-[var(--foreground)]/50 text-[14px] font-bold uppercase tracking-wider">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading Team...
            </div>
        )
    }

    if (!activeBusinessId && !businessLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-[24px] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                    <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-sm font-bold text-[var(--deep-contrast)] uppercase tracking-wider">No Active Business</h2>
                <p className="text-[14px] font-bold text-[var(--foreground)]/40 uppercase tracking-tighter max-w-[200px]">
                    You need an active business profile to manage team members.
                </p>
                <Link href="/dashboard/settings" className="px-6 py-2.5 rounded-xl bg-[var(--deep-contrast)] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--primary-green)] transition-all active:scale-95 shadow-lg">
                    Go to Settings
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--primary-green)]/10">
                <Link href="/dashboard/settings" className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95">
                    <ArrowLeft className="h-4 w-4 text-[var(--deep-contrast)]" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[var(--deep-contrast)] dark:text-[var(--foreground)] tracking-tight">Team Management</h1>
                    <p className="text-[14px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider leading-none">Add partners, admins, and viewers</p>
                </div>
                <div className="flex gap-2">
                    {['PARTNER', 'STAFF', 'VIEWER'].includes(currentUserRole) && (
                        <button
                            onClick={handleLeaveTeam}
                            className="p-3 rounded-2xl bg-rose-500 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 group"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-[14px] font-black uppercase tracking-wider hidden sm:inline">Leave Team</span>
                        </button>
                    )}
                    {isOwner && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 group hover:bg-emerald-700"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="text-[14px] font-black uppercase tracking-wider hidden sm:inline">Add Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <AddTeamMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                businessId={activeBusinessId}
                onSuccess={() => fetchMembers(currentUser?.id)}
            />

            {/* Members List */}
            <div className="glass rounded-[28px] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm shadow-[var(--primary-green)]/5">
                <div className="px-5 py-4 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-[var(--deep-contrast)]/5 text-[var(--deep-contrast)] flex items-center justify-center">
                            <Users className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--deep-contrast)]">Team Members ({members.length})</h3>
                    </div>
                    {fetchingMembers && <Loader2 className="h-3 w-3 animate-spin text-[var(--foreground)]/40" />}
                </div>

                <div className="divide-y divide-white/10">
                    {members.map((member) => (
                        <div key={member.id} className="p-4 hover:bg-white/20 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center text-[var(--deep-contrast)] font-bold text-sm shadow-inner overflow-hidden">
                                    {member.profiles?.avatar_url ? (
                                        <img src={member.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        member.profiles?.full_name?.charAt(0).toUpperCase() || member.profiles?.email?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--deep-contrast)] flex items-center gap-1.5">
                                        {member.profiles?.full_name || 'Pending...'}
                                        {member.user_id === currentUser?.id && (
                                            <span className="text-[11px] font-bold bg-[var(--primary-green)]/10 text-[var(--primary-green)] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>
                                        )}
                                    </p>
                                    <p className="text-[13px] font-bold text-[var(--foreground)]/40 lowercase tracking-tight">
                                        {member.profiles?.username ? `@${member.profiles.username}` : (member.profiles?.email || 'No email synced')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className={clsx(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-black uppercase tracking-wider border transition-all",
                                        member.role === 'OWNER'
                                            ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                            : member.role === 'ADMIN'
                                                ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                                : member.role === 'PARTNER'
                                                    ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                                    : "bg-[var(--foreground)]/5 text-[var(--foreground)]/40 border-[var(--foreground)]/10"
                                    )}>
                                        {member.role === 'OWNER' && <ShieldCheck className="h-2.5 w-2.5" />}
                                        {member.role}
                                    </div>
                                </div>

                                {/* Show controls for owner or if current user invited this member */}
                                {(isOwner || (member.invited_by === currentUser?.id && member.role !== 'OWNER')) && member.role !== 'OWNER' && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isOwner && (
                                            <button
                                                onClick={() => {
                                                    const currentRoleIndex = ROLES.findIndex(r => r.id === member.role)
                                                    const nextRoleIndex = (currentRoleIndex + 1) % ROLES.length
                                                    handleUpdateRole(member.user_id, ROLES[nextRoleIndex].id)
                                                }}
                                                className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-[var(--foreground)]/50 hover:text-[var(--deep-contrast)] transition-all shadow-sm"
                                                title="Update Role"
                                            >
                                                <Shield className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="p-2 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:text-white text-rose-400 transition-all shadow-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="p-10 text-center">
                            <p className="text-[14px] font-bold text-[var(--foreground)]/20 uppercase tracking-wider">No team members found</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                onConfirm={() => executeRemoveMember(confirmModal.userId)}
                isLoading={isDeleting}
                title={confirmModal.action === 'leave' ? 'Leave Team?' : 'Remove Member?'}
                message={confirmModal.action === 'leave'
                    ? 'You will lose all access to this business profile immediately.'
                    : 'This user will lose all access to this business profile immediately.'}
                confirmText={confirmModal.action === 'leave' ? 'Leave' : 'Remove'}
                cancelText={confirmModal.action === 'leave' ? 'Stay' : 'Keep'}
            />

            <ErrorModal
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ ...errorModal, open: false })}
                message={errorModal.message}
            />
        </div>
    )
}
