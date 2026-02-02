'use client'

import { useState, useEffect, useMemo } from 'react'
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

    // Filter expenses by business
    const businessExpenses = expenses.filter(e => e.business_id === activeBusinessId)
    const businessCategories = categories.filter(c => c.business_id === activeBusinessId)

    // Toggle Dock Visibility
    useEffect(() => {
        if (isAddModalOpen) {
            setIsDockHidden(true)
        }
        return () => setIsDockHidden(false)
    }, [isAddModalOpen, setIsDockHidden])



    // Optimize filtering with useMemo
    const filteredExpenses = useMemo(() => {
        return businessExpenses.filter(expense => {
            const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.expense_categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = typeFilter === 'ALL' || expense.type === typeFilter
            const matchesCategory = categoryFilter === 'ALL' || expense.category_id === categoryFilter
            return matchesSearch && matchesType && matchesCategory
        })
    }, [businessExpenses, searchQuery, typeFilter, categoryFilter])

    // Optimize totals with useMemo
    const { totalIn, totalOut } = useMemo(() => {
        const _totalIn = businessExpenses.filter(e => e.type === 'IN').reduce((sum, e) => sum + Number(e.amount), 0)
        const _totalOut = businessExpenses.filter(e => e.type === 'OUT').reduce((sum, e) => sum + Number(e.amount), 0)
        return { totalIn: _totalIn, totalOut: _totalOut }
    }, [businessExpenses])


    // Open add modal
    const openAddModal = (type: 'IN' | 'OUT') => {
        setAddType(type)
        setFormAmount('')
        setFormCategory('')
        setFormDate(new Date().toISOString().split('T')[0])
        setFormDescription('')
        setFormNotes('')
        setIsAddModalOpen(true)
    }

    // Open edit modal
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

    // Handle add expense
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

    // Handle update expense
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

    // Handle delete expense
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

    // Category CRUD logic
    const handleSaveCategory = async () => {
        if (!catFormName.trim() || !activeBusinessId) return
        setCategoryLoading(true)
        setIsGlobalLoading(true)

        try {
            if (editingCategoryId) {
                // Update existing
                const { error } = await supabase
                    .from('expense_categories')
                    .update({ name: catFormName, color: catFormColor, icon: catFormIcon })
                    .eq('id', editingCategoryId)
                if (error) throw error
                showSuccess('Category updated!')
            } else {
                // Create new
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
            // Refresh data
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
            // Refresh data
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
            {/* Header */}
            <div className="flex flex-col gap-4 pb-4 border-b border-[var(--primary-green)]/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[var(--deep-contrast)] tracking-tight">
                            {activeTab === 'expenses' ? 'Expenses' : 'Categories'}
                        </h1>
                        <p className="text-[9px] font-black text-[var(--foreground)]/60 uppercase tracking-wider leading-none">
                            {activeTab === 'expenses' ? 'Track your spending' : 'Organize your finances'}
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div id="expenses-tabs" className="flex p-1 gap-1 glass rounded-2xl border border-white/10 w-fit">
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={clsx(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                            activeTab === 'expenses' ? "bg-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/20" : "text-[var(--foreground)]/40 hover:bg-white/5"
                        )}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={clsx(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                            activeTab === 'categories' ? "bg-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/20" : "text-[var(--foreground)]/40 hover:bg-white/5"
                        )}
                    >
                        Categories
                    </button>
                </div>

                {/* Tab Actions */}
                <div className="flex gap-2">
                    {activeTab === 'expenses' ? (
                        <motion.button
                            id="add-expense-btn"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openAddModal('OUT')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-rose-600/20"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Expense</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            id="new-category-btn"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { resetCatForm(); setIsAddingCategory(true) }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-green)] text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[var(--primary-green)]/20"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Category</span>
                        </motion.button>
                    )}
                </div>
            </div>

            {activeTab === 'expenses' ? (
                <>
                    {/* Summary Card */}
                    <motion.div
                        id="expenses-stats"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass p-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] hover:bg-rose-500/[0.05] transition-all cursor-pointer shadow-sm hover:shadow-rose-500/10 hover:border-rose-500/40"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-rose-600">Total Expenses</span>
                                    <p className="text-base font-black text-rose-600 tabular-nums">{formatCurrency(totalOut)}</p>
                                </div>
                            </div>
                            <span className="text-[8px] font-bold text-[var(--foreground)]/40">{businessExpenses.length} entries</span>
                        </div>
                    </motion.div>


                    {/* Search & Filters */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--foreground)]/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search expenses..."
                                className="w-full h-8 pl-8 pr-3 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[9px] font-bold focus:outline-none focus:border-[var(--primary-green)]"
                            />
                        </div>
                        <button
                            onClick={() => setIsCategoryFilterOpen(true)}
                            className={clsx(
                                "px-3 h-8 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all",
                                categoryFilter !== 'ALL' ? "bg-[var(--primary-green)]/10 border-[var(--primary-green)]/40 text-[var(--primary-green)]" : "bg-[var(--foreground)]/5 border-[var(--foreground)]/10 text-[var(--foreground)]/60"
                            )}
                        >
                            <Filter className="h-3 w-3" />
                        </button>
                    </div>


                    {/* Expenses List */}
                    <div id="expenses-list" className="space-y-2">
                        {filteredExpenses.length === 0 ? (
                            <div className="glass rounded-2xl border border-[var(--foreground)]/10 p-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className="h-6 w-6 text-[var(--foreground)]/20" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground)]/40">No expenses yet</p>
                                <p className="text-[9px] text-[var(--foreground)]/30 mt-1">Tap "+ In" or "+ Out" to add</p>
                            </div>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass rounded-xl border border-[var(--foreground)]/10 p-1.5 flex items-center justify-between group h-[44px]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={clsx(
                                            "h-6 w-6 rounded-lg flex items-center justify-center shadow-md",
                                            expense.type === 'IN' ? "bg-emerald-500" : "bg-rose-500"
                                        )}>
                                            {expense.type === 'IN' ?
                                                <ArrowUpRight className="h-3 w-3 text-white" /> :
                                                <ArrowDownRight className="h-3 w-3 text-white" />
                                            }
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black text-[var(--deep-contrast)] uppercase tracking-tight leading-none">
                                                {expense.description || expense.expense_categories?.name || 'Uncategorized'}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[7px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">
                                                    {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                {expense.expense_categories && (
                                                    <span className="px-1 py-0.5 rounded-full text-[6px] font-black uppercase tracking-wider" style={{ backgroundColor: expense.expense_categories.color + '20', color: expense.expense_categories.color }}>
                                                        {expense.expense_categories.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={clsx(
                                            "text-[11px] font-black tabular-nums tracking-tighter",
                                            expense.type === 'IN' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {expense.type === 'IN' ? '+' : '-'}{formatCurrency(expense.amount)}
                                        </p>
                                        <button
                                            onClick={() => openEditModal(expense)}
                                            className="p-1 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            <Edit2 className="h-2.5 w-2.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(expense)}
                                            className="p-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    {/* Inline Category Management - Redesigned */}
                    {(isAddingCategory || editingCategoryId) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0a0a] text-white shadow-xl"
                        >
                            {/* Decorative Background */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[60px]" />
                            </div>

                            <div className="relative p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/90">
                                        {editingCategoryId ? 'Edit Category' : 'New Category'}
                                    </h3>
                                    <button onClick={resetCatForm} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                        <X className="h-3.5 w-3.5 text-white/60" />
                                    </button>
                                </div>

                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Name</label>
                                    <input
                                        type="text"
                                        value={catFormName}
                                        onChange={(e) => setCatFormName(e.target.value)}
                                        placeholder="e.g. Office Supplies"
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-[11px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                </div>

                                {/* Color & Icon */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Color Code</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setCatFormColor(color)}
                                                    className={clsx(
                                                        "h-8 w-8 rounded-full transition-all border-2",
                                                        catFormColor === color ? "border-white scale-110 shadow-lg shadow-white/20" : "border-transparent hover:scale-105"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Iconography</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {CATEGORY_ICONS.map(({ id, icon: Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setCatFormIcon(id)}
                                                    className={clsx(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all border",
                                                        catFormIcon === id
                                                            ? "bg-[var(--primary-green)] border-[var(--primary-green)] text-white shadow-lg shadow-[var(--primary-green)]/20"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={resetCatForm}
                                        className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveCategory}
                                        disabled={categoryLoading || !catFormName.trim()}
                                        className="flex-1 h-12 rounded-xl bg-[var(--primary-green)] text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[var(--primary-green)]/20 disabled:opacity-50 disabled:shadow-none hover:brightness-110 transition-all"
                                    >
                                        {categoryLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : editingCategoryId ? 'Update Category' : 'Create Category'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {businessCategories.length === 0 && !isAddingCategory ? (
                            <div className="col-span-2 glass rounded-2xl border border-[var(--foreground)]/10 p-12 text-center">
                                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground)]/40">No categories yet</p>
                                <p className="text-[9px] text-[var(--foreground)]/30 mt-1">Tap "New Category" to get started</p>
                            </div>
                        ) : (
                            businessCategories.map((category) => {
                                const CategoryIcon = CATEGORY_ICONS.find(i => i.id === category.icon)?.icon || Wallet
                                return (
                                    <motion.div
                                        key={category.id}
                                        layout
                                        className="flex flex-col p-4 rounded-2xl glass border border-[var(--foreground)]/10 group relative"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div
                                                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-xl shadow-opacity-20"
                                                style={{ backgroundColor: category.color, boxShadow: `0 8px 16px -4px ${category.color}40` }}
                                            >
                                                <CategoryIcon className="h-5 w-5" />
                                            </div>
                                            <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategoryId(category.id)
                                                        setCatFormName(category.name)
                                                        setCatFormColor(category.color)
                                                        setCatFormIcon(category.icon || 'wallet')
                                                        setIsAddingCategory(false)
                                                    }}
                                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-[var(--deep-contrast)] uppercase tracking-tight truncate">{category.name}</h4>
                                            <p className="text-[8px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest mt-0.5">
                                                {expenses.filter(e => e.category_id === category.id).length} Entries
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Add Expense Modal - Redesigned */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop with cosmic effect */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsAddModalOpen(false); setEditTarget(null) }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.2),transparent_70%)] opacity-50" />
                        </motion.div>

                        {/* Modal Content - Cyber Style */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a] text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Background Mesh */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgb(var(--primary-green))_0%,transparent_50%)] blur-[80px]" />
                            </div>

                            {/* Header */}
                            <div className="relative p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-white/90">
                                            {editTarget ? 'Edit' : 'New'} <span className={addType === 'IN' ? "text-emerald-400" : "text-rose-400"}>{addType === 'IN' ? 'Income' : 'Expense'}</span>
                                        </h2>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
                                            {editTarget ? 'Update Record' : 'Create Entry'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsAddModalOpen(false); setEditTarget(null) }}
                                        className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                                    >
                                        <X className="h-4 w-4 text-white/60" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative p-6 space-y-5">
                                {/* Amount Input - Large & Central */}
                                <div className="relative group">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={(e) => setFormAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 px-4 text-3xl font-black text-center text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-white/20">USD</div>
                                    </div>
                                </div>

                                {/* Date & Category Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Date</label>
                                        <button
                                            onClick={() => setIsDatePickerOpen(true)}
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-3 flex items-center gap-2 hover:bg-white/10 transition-all group"
                                        >
                                            <Calendar className="h-4 w-4 text-white/40 group-hover:text-white/60" />
                                            <span className="text-[10px] font-bold text-white/80">
                                                {new Date(formDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Category</label>
                                        <button
                                            onClick={() => setIsCategoryPickerOpen(true)}
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-3 flex items-center justify-between hover:bg-white/10 transition-all group"
                                        >
                                            <span className="text-[10px] font-bold text-white/80 truncate">
                                                {businessCategories.find(c => c.id === formCategory)?.name || 'Select...'}
                                            </span>
                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <Plus className="h-3 w-3 text-white/60" />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Description</label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="What was this for?"
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-[11px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                </div>

                                {/* Action Button - Magnetic Style */}
                                <div className="pt-2">
                                    <button
                                        onClick={editTarget ? handleUpdateExpense : handleAddExpense}
                                        disabled={loading || !formAmount}
                                        className={clsx(
                                            "relative w-full h-14 rounded-2xl overflow-hidden group disabled:opacity-50",
                                            addType === 'IN' ? "bg-emerald-500" : "bg-rose-500"
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

            {/* Modals */}
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
                description="This will permanently remove this expense record."
                confirmLabel="Delete"
            />
        </div>
    )
}
