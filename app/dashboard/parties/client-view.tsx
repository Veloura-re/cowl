'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import CreatePartyModal from './create-party-modal'

type Party = {
    id: string
    name: string
    phone: string | null
    type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH'
    opening_balance: number
}

export default function PartiesClientView({ initialParties }: { initialParties: any[] }) {
    const [parties, setParties] = useState(initialParties)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const filteredParties = parties.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search))
    )

    // MOCK: Handle create would go here, usually strictly typed

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Parties</h1>
                    <p className="mt-1 text-[var(--text-secondary)]">
                        Manage your customers and suppliers
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Party
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-highlight)]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search parties..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg bg-[var(--background)] py-2 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] border border-transparent focus:border-[var(--primary)]"
                    />
                </div>
                <button className="flex items-center rounded-lg border border-[var(--surface-highlight)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-highlight)] hover:text-[var(--text-main)] transition-colors">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </button>
            </div>

            {/* List */}
            <div className="rounded-xl border border-[var(--surface-highlight)] bg-[var(--surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--surface-highlight)]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Name</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Phone</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Type</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Balance</th>
                                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-highlight)]">
                            {filteredParties.length > 0 ? (
                                filteredParties.map((party) => (
                                    <tr key={party.id} className="group hover:bg-[var(--surface-highlight)]/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[var(--text-main)]">
                                            {party.name}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                                            {party.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={
                                                party.type === 'CUSTOMER' ? 'text-[var(--info)]' :
                                                    party.type === 'SUPPLIER' ? 'text-[var(--warning)]' : 'text-[var(--primary)]'
                                            }>
                                                {party.type}
                                            </span>
                                        </td>
                                        <td className={
                                            "px-6 py-4 text-right font-medium " +
                                            (party.opening_balance > 0 ? 'text-[var(--success)]' : party.opening_balance < 0 ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]')
                                        }>
                                            {party.opening_balance > 0 ? '+' : ''}{party.opening_balance}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        No parties found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreatePartyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
