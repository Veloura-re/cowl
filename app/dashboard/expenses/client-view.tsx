'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Settings2, Trash2, Search, Filter, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2, X, Edit2, Wallet, ShoppingCart, Home, Car, Zap, Utensils, Coffee, ShoppingBag, Briefcase, GraduationCap, Heart, Smartphone, Plane, Gift, Dumbbell } from 'lucide-react'
import { useBusiness } from '@/context/business-context'
import { createClient } from '@/utils/supabase/client'
import clsx from 'clsx'
import PickerModal from '@/components/ui/PickerModal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import DatePickerModal from '@/components/ui/DatePickerModal'

const COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'
]

const CATEGORY_ICONS = [
    { id: 'wallet', icon: Wallet },
    { id: 'shopping-cart', icon: ShoppingCart },
    { id: 'home', icon: Home },
    { id: 'car', icon: Car },
    { id: 'zap', icon: Zap },
    { id: 'utensils', icon: Utensils },
    { id: 'coffee', icon: Coffee },
    { id: 'shopping-bag', icon: ShoppingBag },
    { id: 'briefcase', icon: Briefcase },
    { id: 'graduation-cap', icon: GraduationCap },
    { id: 'heart', icon: Heart },
    { id: 'smartphone', icon: Smartphone },
    { id: 'plane', icon: Plane },
    { id: 'gift', icon: Gift },
    { id: 'dumbbell', icon: Dumbbell },
]

type ExpenseCategory = {
    id: string
    business_id: string
    name: string
    type: 'IN' | 'OUT' | 'BOTH'
    icon: string
    color: string
}

type Expense = {
    id: string
    business_id: string
    category_id: string | null
    amount: number
    type: 'IN' | 'OUT'
    date: string
    description: string
    notes: string
    expense_categories?: {
        name: string
        icon: string
        color: string
    }
}

type Props = {
    initialCategories: ExpenseCategory[]
    initialExpenses: Expense[]
}

// Memoized Expense Card
const ExpenseCard = React.memo(({
    expense,
    formatCurrency,
    openEditModal,
    setDeleteTarget
}: {
    expense: any,
    formatCurrency: any,
    openEditModal: any,
    setDeleteTarget: any
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openEditModal(expense)}
            className="glass-optimized rounded-[24px] border border-[var(--foreground)]/5 p-4 flex items-center justify-between group hover:border-[var(--primary-green)]/20 transition-all cursor-pointer bg-white/[0.02] will-change-transform"
        >
            <div className="flex items-center gap-4">
                <div className={clsx(
                    "h-12 w-12 rounded-[18px] flex items-center justify-center shadow-lg",
                    expense.type === 'IN' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                    {expense.type === 'IN' ?
                        <ArrowUpRight className="h-5 w-5" /> :
                        <ArrowDownRight className="h-5 w-5" />
                    }
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight leading-none mb-1.5">
                        {expense.description || expense.expense_categories?.name || 'Unlabeled Transaction'}
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-[var(--foreground)]/30 uppercase tracking-widest">
                            {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {expense.expense_categories && (
                            <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-current" style={{ color: expense.expense_categories.color, opacity: 0.7 }}>
                                {expense.expense_categories.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className={clsx(
                    "text-sm font-black tabular-nums tracking-tighter",
                    expense.type === 'IN' ? "text-emerald-500" : "text-rose-500"
                )}>
                    {expense.type === 'IN' ? '+' : '-'}{formatCurrency(expense.amount)}
                </p>
                <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(expense); }}
                    className="h-8 w-8 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/10"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    )
})

ExpenseCard.displayName = 'ExpenseCard'

export default function ExpensesClientView({ initialCategories, initialExpenses }: Props) {
    const { activeBusinessId, formatCurrency, showSuccess, showError, setIsGlobalLoading, setIsDockHidden } = useBusiness()
    const supabase = createClient()

    // State
    const [categories, setCategories] = useState<ExpenseCategory[]>(initialCategories)
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL')
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [addType, setAddType] = useState<'IN' | 'OUT'>('OUT')
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false)
    const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
    const [editTarget, setEditTarget] = useState<Expense | null>(null)

    // Category Management State
    const [activeTab, setActiveTab] = useState<'expenses' | 'categories'>('expenses')
    const [categoryLoading, setCategoryLoading] = useState(false)
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [catFormName, setCatFormName] = useState('')
    const [catFormColor, setCatFormColor] = useState(COLORS[0])
    const [catFormIcon, setCatFormIcon] = useState('wallet')

    const resetCatForm = () => {
        setCatFormName('')
        setCatFormColor(COLORS[0])
        setCatFormIcon('wallet')
        setEditingCategoryId(null)
        setIsAddingCategory(false)
    }

    // Add expense form state
    const [formAmount, setFormAmount] = useState('')
    const [formCategory, setFormCategory] = useState('')
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
    const [formDescription, setFormDescription] = useState('')
    const [formNotes, setFormNotes] = useState('')
    const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

    // Fetch data on mount and when business changes
    useEffect(() => {
        if (!activeBusinessId) return

        const fetchData = async () => {
            setInitialLoading(true)
            try {
                const [categoriesRes, expensesRes] = await Promise.all([
                    supabase.from('expense_categories').select('*').eq('business_id', activeBusinessId).order('name'),
                    supabase.from('expenses').select('*, expense_categories(name, icon, color)').eq('business_id', activeBusinessId).order('date', { ascending: false })
                ])
                if (categoriesRes.data) setCategories(categoriesRes.data)
                if (expensesRes.data) setExpenses(expensesRes.data)
            } catch (err) {
                console.error('Failed to fetch expenses data:', err)
            } finally {
                setInitialLoading(false)
            }
        }

        fetchData()
    }, [activeBusinessId])

    const businessExpenses = expenses.filter(e => e.business_id === activeBusinessId)
    const businessCategories = categories.filter(c => c.business_id === activeBusinessId)

    useEffect(() => {
        if (isAddModalOpen) {
            setIsDockHidden(true)
        }
        return () => setIsDockHidden(false)
    }, [isAddModalOpen, setIsDockHidden])

    const filteredExpenses = useMemo(() => {
        return businessExpenses.filter(expense => {
            const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.expense_categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = typeFilter === 'ALL' || expense.type === typeFilter
            const matchesCategory = categoryFilter === 'ALL' || expense.category_id === categoryFilter
            return matchesSearch && matchesType && matchesCategory
        })
    }, [businessExpenses, searchQuery, typeFilter, categoryFilter])

    const { totalIn, totalOut } = useMemo(() => {
        const _totalIn = businessExpenses.filter(e => e.type === 'IN').reduce((sum, e) => sum + Number(e.amount), 0)
        const _totalOut = businessExpenses.filter(e => e.type === 'OUT').reduce((sum, e) => sum + Number(e.amount), 0)
        return { totalIn: _totalIn, totalOut: _totalOut }
    }, [businessExpenses])

    const openAddModal = (type: 'IN' | 'OUT') => {
        setAddType(type)
        setFormAmount('')
        setFormCategory('')
        setFormDate(new Date().toISOString().split('T')[0])
        setFormDescription('')
        setFormNotes('')
        setIsAddModalOpen(true)
    }

    const openEditModal = (expense: Expense) => {
        setEditTarget(expense)
        setAddType(expense.type)
        setFormAmount(expense.amount.toString())
        setFormCategory(expense.category_id || '')
        setFormDate(expense.date)
        setFormDescription(expense.description || '')
        setFormNotes(expense.notes || '')
        setIsAddModalOpen(true)
    }

    const handleAddExpense = async () => {
        if (!formAmount || !activeBusinessId) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    business_id: activeBusinessId,
                    category_id: formCategory || null,
                    amount: Number(formAmount),
                    type: addType,
                    date: formDate,
                    description: formDescription,
                    notes: formNotes
                })
                .select('*, expense_categories(name, icon, color)')
                .single()

            if (error) throw error

            setExpenses(prev => [data, ...prev])
            setIsAddModalOpen(false)
            setEditTarget(null)
            showSuccess(`${addType === 'IN' ? 'Income' : 'Expense'} added successfully!`)
        } catch (err: any) {
            showError(err.message, 'Failed to add')
        } finally {
            setLoading(false)
            setIsGlobalLoading(false)
        }
    }

    const handleUpdateExpense = async () => {
        if (!editTarget || !formAmount || !activeBusinessId) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
            const { data, error } = await supabase
                .from('expenses')
                .update({
                    category_id: formCategory || null,
                    amount: Number(formAmount),
                    type: addType,
                    date: formDate,
                    description: formDescription,
                    notes: formNotes
                })
                .eq('id', editTarget.id)
                .select('*, expense_categories(name, icon, color)')
                .single()

            if (error) throw error

            setExpenses(prev => prev.map(e => e.id === editTarget.id ? data : e))
            setIsAddModalOpen(false)
            setEditTarget(null)
            showSuccess('Expense updated successfully!')
        } catch (err: any) {
            showError(err.message, 'Failed to update')
        } finally {
            setLoading(false)
            setIsGlobalLoading(false)
        }
    }

    const handleDeleteExpense = async () => {
        if (!deleteTarget) return
        setLoading(true)
        setIsGlobalLoading(true)

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', deleteTarget.id)

            if (error) throw error

            setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id))
            setDeleteTarget(null)
            showSuccess('Expense deleted successfully!')
        } catch (err: any) {
            showError(err.message, 'Failed to delete')
        } finally {
            setLoading(false)
            setIsGlobalLoading(false)
        }
    }

    const handleSaveCategory = async () => {
        if (!catFormName.trim() || !activeBusinessId) return
        setCategoryLoading(true)
        setIsGlobalLoading(true)

        try {
            if (editingCategoryId) {
                const { error } = await supabase
                    .from('expense_categories')
                    .update({ name: catFormName, color: catFormColor, icon: catFormIcon })
                    .eq('id', editingCategoryId)
                if (error) throw error
                showSuccess('Category updated!')
            } else {
                const { error } = await supabase
                    .from('expense_categories')
                    .insert({
                        business_id: activeBusinessId,
                        name: catFormName,
                        color: catFormColor,
                        icon: catFormIcon,
                        type: 'OUT'
                    })
                if (error) throw error
                showSuccess('Category created!')
            }
            resetCatForm()
            const { data } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('business_id', activeBusinessId)
                .order('name')
            if (data) setCategories(data)
        } catch (err: any) {
            showError(err.message, 'Failed to save category')
        } finally {
            setCategoryLoading(false)
            setIsGlobalLoading(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        setIsGlobalLoading(true)
        try {
            const { error } = await supabase
                .from('expense_categories')
                .delete()
                .eq('id', id)
            if (error) throw error
            showSuccess('Category deleted!')
            const { data } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('business_id', activeBusinessId)
                .order('name')
            if (data) setCategories(data)
        } catch (err: any) {
            showError(err.message, 'Failed to delete category')
        } finally {
            setIsGlobalLoading(false)
        }
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="flex flex-col items-center justify-center pt-4 pb-2">
                <h1 className="text-sm font-black text-[var(--deep-contrast)] uppercase tracking-[0.4em] text-center">
                    Financial Ledger
                </h1>
                <div className="h-1 w-8 bg-[var(--primary-green)] rounded-full mt-2" />
            </div>

            {activeTab === 'expenses' ? (
                <>
                    <div className="relative px-3 py-6">
                        <motion.div
                            id="expenses-stats"
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative"
                        >
                            <div className="relative rounded-[28px] overflow-hidden">
                                <div className="absolute inset-0 rounded-[28px] p-[1px] bg-gradient-to-br from-rose-500/40 via-transparent to-rose-500/20">
                                    <div className="h-full w-full rounded-[27px] bg-[var(--background)]" />
                                </div>

                                <div className="relative glass backdrop-blur-3xl bg-[var(--background)]/60 border border-white/5 rounded-[28px] p-6">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--primary-green)]/5 rounded-full blur-[60px] pointer-events-none" />

                                    <div className="relative flex items-start justify-between mb-5">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-10 w-10 rounded-[16px] bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                                    <ArrowDownRight size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-rose-500/80">
                                                        Resource Drain
                                                    </span>
                                                    <span className="block text-[7px] font-bold uppercase tracking-wider text-[var(--foreground)]/30">
                                                        {businessExpenses.length} Transactions
                                                    </span>
                                                </div>
                                            </div>

                                            <h2 className="text-3xl font-black text-[var(--deep-contrast)] tabular-nums tracking-tight">
                                                {formatCurrency(totalOut)}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="relative h-[1px] bg-gradient-to-r from-transparent via-[var(--foreground)]/10 to-transparent my-5" />

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => openAddModal('OUT')}
                                            className="group relative h-12 rounded-[18px] bg-gradient-to-br from-rose-500 to-rose-600 text-white overflow-hidden shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 active:scale-[0.97] transition-all"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center justify-center gap-2">
                                                <Plus size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Record</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('categories')}
                                            className="group relative h-12 rounded-[18px] bg-[var(--foreground)]/5 text-[var(--foreground)] border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10 hover:border-[var(--foreground)]/20 active:scale-[0.97] transition-all"
                                        >
                                            <div className="relative flex items-center justify-center gap-2">
                                                <Settings2 size={14} className="opacity-60" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Types</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex gap-3 px-1 mt-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground)]/20 group-focus-within:text-[var(--primary-green)] transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Query ledger..."
                                className="w-full h-12 pl-11 pr-4 rounded-[20px] bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary-green)] focus:bg-white/[0.06] transition-all placeholder:text-[var(--foreground)]/10"
                            />
                        </div>
                        <button
                            onClick={() => setIsCategoryFilterOpen(true)}
                            className={clsx(
                                "w-12 h-12 flex items-center justify-center rounded-[20px] border transition-all active:scale-95",
                                categoryFilter !== 'ALL' ? "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/40 text-[var(--primary-green)] shadow-lg shadow-[var(--primary-green)]/10" : "bg-white/[0.03] border-white/5 text-[var(--foreground)]/30 hover:border-white/10"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>

                    <div id="expenses-list" className="space-y-3 mt-6">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40">Chronicle</h4>
                            <div className="h-px flex-1 mx-4 bg-[var(--foreground)]/5" />
                        </div>

                        {filteredExpenses.length === 0 ? (
                            <div className="glass rounded-[32px] border border-[var(--foreground)]/10 p-12 text-center bg-white/5">
                                <div className="h-16 w-16 rounded-[24px] bg-[var(--foreground)]/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <TrendingUp className="h-8 w-8 text-[var(--foreground)]/10" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]/40">Clear Horizon</p>
                                <p className="text-[9px] font-black text-[var(--foreground)]/20 uppercase tracking-widest mt-2">Ready for inputs</p>
                            </div>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <ExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    formatCurrency={formatCurrency}
                                    openEditModal={openEditModal}
                                    setDeleteTarget={setDeleteTarget}
                                />
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h2 className="text-xl font-black text-[var(--deep-contrast)] uppercase tracking-tight">
                                Classifications
                            </h2>
                            <p className="text-[10px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em] mt-0.5">
                                Manage ledger types
                            </p>
                        </div>
                        <button
                            onClick={() => { resetCatForm(); setIsAddingCategory(true); }}
                            className="h-12 px-6 rounded-[20px] bg-[var(--primary-green)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-green)]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            New Type
                        </button>
                    </div>

                    <div className="flex gap-2 px-1">
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className="flex-1 h-12 rounded-[20px] bg-[var(--foreground)]/5 text-[var(--foreground)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--foreground)]/10 transition-all flex items-center justify-center gap-2"
                        >
                            Back to Ledger
                        </button>
                    </div>

                    <AnimatePresence>
                        {(isAddingCategory || editingCategoryId) && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={resetCatForm}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-xl dark:bg-black/60 bg-white/10"
                                />

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                    className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-[var(--foreground)]/10 bg-[var(--background)]/90 backdrop-blur-2xl text-[var(--foreground)]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                                        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[80px]" />
                                    </div>

                                    <div className="relative p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--deep-contrast)]">
                                                {editingCategoryId ? 'Edit' : 'New'} <span className="text-[var(--primary-green)]">Category</span>
                                            </h3>
                                            <button onClick={resetCatForm} className="h-8 w-8 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 flex items-center justify-center transition-all">
                                                <X className="h-4 w-4 text-[var(--foreground)]/40" />
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 ml-1">Name</label>
                                            <input
                                                type="text"
                                                value={catFormName}
                                                onChange={(e) => setCatFormName(e.target.value)}
                                                placeholder="e.g. Office Supplies"
                                                className="w-full h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-bold text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 focus:outline-none focus:border-[var(--primary-green)]/30 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 mb-2 ml-1">Color Palette</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {COLORS.map((color) => (
                                                        <button
                                                            key={color}
                                                            onClick={() => setCatFormColor(color)}
                                                            className={clsx(
                                                                "h-8 w-8 rounded-full transition-all border-2",
                                                                catFormColor === color ? "border-[var(--foreground)] scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                                            )}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 mb-2 ml-1">Iconography</label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {CATEGORY_ICONS.map(({ id, icon: Icon }) => (
                                                        <button
                                                            key={id}
                                                            onClick={() => setCatFormIcon(id)}
                                                            className={clsx(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all border",
                                                                catFormIcon === id
                                                                    ? "bg-[var(--primary-green)] border-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/20"
                                                                    : "bg-[var(--foreground)]/5 border-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/10 hover:text-[var(--foreground)]"
                                                            )}
                                                        >
                                                            <Icon className="h-5 w-5" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={handleSaveCategory}
                                                disabled={categoryLoading || !catFormName.trim()}
                                                className="w-full h-14 rounded-2xl bg-[var(--primary-green)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-green)]/20 disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                            >
                                                {categoryLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        {editingCategoryId ? 'Update Category' : 'Create Category'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {businessCategories.length === 0 && !isAddingCategory ? (
                            <div className="col-span-2 glass rounded-[32px] border border-[var(--foreground)]/10 p-16 text-center bg-white/5">
                                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]/40">No Classifications</p>
                                <p className="text-[9px] font-black text-[var(--foreground)]/20 uppercase tracking-widest mt-2">Tap "Categories" above to view list</p>
                            </div>
                        ) : (
                            businessCategories.map((category) => {
                                const CategoryIcon = CATEGORY_ICONS.find(i => i.id === category.icon)?.icon || Wallet
                                return (
                                    <motion.div
                                        key={category.id}
                                        layout
                                        className="flex flex-col p-6 rounded-[32px] glass border border-white/5 group relative bg-white/[0.02] hover:border-[var(--primary-green)]/20 transition-all cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            setEditingCategoryId(category.id)
                                            setCatFormName(category.name)
                                            setCatFormColor(category.color)
                                            setCatFormIcon(category.icon || 'wallet')
                                            setIsAddingCategory(false)
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-6 relative z-10">
                                            <div
                                                className="h-12 w-12 rounded-[20px] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: category.color, boxShadow: `0 12px 24px -6px ${category.color}60` }}
                                            >
                                                <CategoryIcon className="h-6 w-6" />
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                                className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="text-[12px] font-black text-[var(--deep-contrast)] uppercase tracking-tight truncate">{category.name}</h4>
                                            <p className="text-[9px] font-black text-[var(--foreground)]/30 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                {expenses.filter(e => e.category_id === category.id).length} Entries
                                            </p>
                                        </div>

                                        <div className="absolute -bottom-8 -right-8 w-24 h-24 blur-[40px] opacity-10 rounded-full" style={{ backgroundColor: category.color }} />
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsAddModalOpen(false); setEditTarget(null) }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.2),transparent_70%)] opacity-50" />
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-[var(--foreground)]/10 bg-[var(--background)]/90 backdrop-blur-2xl text-[var(--foreground)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[80px]" />
                            </div>

                            <div className="relative p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-[var(--deep-contrast)]">
                                            {editTarget ? 'Edit' : 'New'} <span className={addType === 'IN' ? "text-emerald-500" : "text-rose-500"}>{addType === 'IN' ? 'Income' : 'Expense'}</span>
                                        </h2>
                                        <p className="text-[9px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.2em] mt-1">
                                            {editTarget ? 'Update Record' : 'Create Entry'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsAddModalOpen(false); setEditTarget(null) }}
                                        className="h-8 w-8 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 flex items-center justify-center transition-all"
                                    >
                                        <X className="h-4 w-4 text-[var(--foreground)]/40" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative p-6 space-y-5">
                                <div className="relative group">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 mb-2 ml-1">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={(e) => setFormAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full h-16 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-3xl font-black text-center text-[var(--foreground)] placeholder:text-[var(--foreground)]/10 focus:outline-none focus:border-[var(--primary-green)]/30 focus:bg-[var(--foreground)]/10 transition-all tabular-nums"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--foreground)]/20">USD</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 ml-1">Date</label>
                                        <button
                                            onClick={() => setIsDatePickerOpen(true)}
                                            className="w-full h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 flex items-center gap-2 hover:bg-[var(--foreground)]/10 transition-all group"
                                        >
                                            <Calendar className="h-4 w-4 text-[var(--foreground)]/40 group-hover:text-[var(--foreground)]/60" />
                                            <span className="text-[10px] font-bold text-[var(--foreground)]/80">
                                                {new Date(formDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 ml-1">Category</label>
                                        <button
                                            onClick={() => setIsCategoryPickerOpen(true)}
                                            className="w-full h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-3 flex items-center justify-between hover:bg-[var(--foreground)]/10 transition-all group"
                                        >
                                            <span className="text-[10px] font-bold text-[var(--foreground)]/80 truncate">
                                                {businessCategories.find(c => c.id === formCategory)?.name || 'Select...'}
                                            </span>
                                            <div className="h-5 w-5 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center">
                                                <Plus className="h-3 w-3 text-[var(--foreground)]/60" />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]/40 ml-1">Description</label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="What was this for?"
                                        className="w-full h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 text-[11px] font-bold text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 focus:outline-none focus:border-[var(--primary-green)]/30 transition-all"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    {editTarget && (
                                        <button
                                            onClick={() => setDeleteTarget(editTarget)}
                                            className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-rose-500/5"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={editTarget ? handleUpdateExpense : handleAddExpense}
                                        disabled={loading || !formAmount}
                                        className={clsx(
                                            "relative flex-1 h-14 rounded-2xl overflow-hidden group disabled:opacity-50 shadow-lg transition-all active:scale-[0.98]",
                                            addType === 'IN' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                                        <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            {editTarget ? 'Update Entry' : 'Save Entry'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PickerModal
                isOpen={isTypeFilterOpen}
                onClose={() => setIsTypeFilterOpen(false)}
                onSelect={(val) => setTypeFilter(val as any)}
                title="Filter by Type"
                options={[
                    { id: 'ALL', label: 'All' },
                    { id: 'IN', label: 'Money In' },
                    { id: 'OUT', label: 'Money Out' },
                ]}
                selectedValue={typeFilter}
            />

            <PickerModal
                isOpen={isCategoryFilterOpen}
                onClose={() => setIsCategoryFilterOpen(false)}
                onSelect={(val) => setCategoryFilter(val)}
                title="Filter by Category"
                options={[
                    { id: 'ALL', label: 'All Categories' },
                    ...businessCategories.map(c => ({ id: c.id, label: c.name }))
                ]}
                selectedValue={categoryFilter}
            />

            <PickerModal
                isOpen={isCategoryPickerOpen}
                onClose={() => setIsCategoryPickerOpen(false)}
                onSelect={(val) => { setFormCategory(val); setIsCategoryPickerOpen(false); }}
                title="Choose Category"
                options={businessCategories
                    .filter(c => c.type === 'BOTH' || c.type === addType)
                    .map(c => ({ id: c.id, label: c.name }))
                }
                selectedValue={formCategory}
            />

            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onSelect={(date) => { setFormDate(date); setIsDatePickerOpen(false); }}
                selectedValue={formDate}
                title="Select Date"
            />

            <ConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteExpense}
                title="Delete Expense?"
                description="This will permanently remove this expense record from your ledger. This action cannot be undone."
                confirmLabel="Delete"
                icon={Trash2}
                variant="danger"
            />
        </div>
    )
}
