'use client'

import { User, Building, Lock } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)]">Settings</h1>
                <p className="mt-1 text-[var(--text-secondary)]">Manage business and account preferences</p>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Business Profile */}
                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--surface-highlight)] flex items-center gap-3">
                        <Building className="h-5 w-5 text-[var(--primary)]" />
                        <h3 className="font-semibold text-[var(--text-main)]">Business Profile</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Business Name</label>
                                <input type="text" disabled defaultValue="My Business" className="w-full rounded bg-[var(--background)] px-3 py-2 text-[var(--text-main)] border border-[var(--surface-highlight)] disabled:opacity-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
                                <input type="text" disabled defaultValue="+1 234 567 890" className="w-full rounded bg-[var(--background)] px-3 py-2 text-[var(--text-main)] border border-[var(--surface-highlight)] disabled:opacity-50" />
                            </div>
                        </div>
                        <button className="text-sm text-[var(--primary)] hover:underline">Edit Details</button>
                    </div>
                </div>

                {/* Security */}
                <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--surface-highlight)] flex items-center gap-3">
                        <Lock className="h-5 w-5 text-[var(--warning)]" />
                        <h3 className="font-semibold text-[var(--text-main)]">Security</h3>
                    </div>
                    <div className="p-6">
                        <button className="px-4 py-2 rounded border border-[var(--surface-highlight)] hover:bg-[var(--surface-highlight)] text-[var(--text-main)] text-sm transition-colors">
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
