import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export const useMonexaStore = create((set, get) => ({
  transactions: [],
  wallets: [],
  budgets: [],
  savingsGoals: [],
  loading: false,
  error: null,

  // ============================================
  // WALLETS
  // ============================================
  fetchWallets: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('monexa_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ wallets: data || [] })
    } catch (error) {
      set({ error: error.message })
    }
  },

  addWallet: async (wallet) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }
    try {
      const { data, error } = await supabase
        .from('monexa_wallets')
        .insert([{ ...wallet, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      set({ wallets: [data, ...get().wallets] })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateWallet: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('monexa_wallets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set({ wallets: get().wallets.map((w) => (w.id === id ? data : w)) })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  deleteWallet: async (id) => {
    try {
      const { error } = await supabase.from('monexa_wallets').delete().eq('id', id)
      if (error) throw error
      set({ wallets: get().wallets.filter((w) => w.id !== id) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // ============================================
  // BUDGETS
  // ============================================
  fetchBudgets: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('monexa_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ budgets: data || [] })
    } catch (error) {
      set({ error: error.message })
    }
  },

  addBudget: async (budget) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }
    try {
      const { data, error } = await supabase
        .from('monexa_budgets')
        .upsert([{ ...budget, user_id: user.id }], {
          onConflict: 'user_id,category,period',
        })
        .select()
        .single()
      if (error) throw error
      const existing = get().budgets.find(
        (b) => b.category === data.category && b.period === data.period
      )
      if (existing) {
        set({ budgets: get().budgets.map((b) => (b.id === existing.id ? data : b)) })
      } else {
        set({ budgets: [data, ...get().budgets] })
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateBudget: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('monexa_budgets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set({ budgets: get().budgets.map((b) => (b.id === id ? data : b)) })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  deleteBudget: async (id) => {
    try {
      const { error } = await supabase.from('monexa_budgets').delete().eq('id', id)
      if (error) throw error
      set({ budgets: get().budgets.filter((b) => b.id !== id) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Tính tiến độ ngân sách hiện tại theo danh mục
  getBudgetProgress: (budgetId) => {
    const { budgets, transactions } = get()
    const budget = budgets.find((b) => b.id === budgetId)
    if (!budget) return { spent: 0, percent: 0, remaining: budget?.amount || 0 }

    const now = new Date()
    const spent = transactions
      .filter((t) => {
        if (t.type !== 'chi_tieu' || t.category !== budget.category) return false
        const d = new Date(t.date)
        if (budget.period === 'monthly') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        } else if (budget.period === 'yearly') {
          return d.getFullYear() === now.getFullYear()
        } else if (budget.period === 'weekly') {
          const oneWeekAgo = new Date(now)
          oneWeekAgo.setDate(now.getDate() - 7)
          return d >= oneWeekAgo && d <= now
        }
        return false
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      spent,
      percent: Math.min(100, Math.round((spent / Number(budget.amount)) * 100)),
      remaining: Math.max(0, Number(budget.amount) - spent),
    }
  },

  // ============================================
  // SAVINGS GOALS
  // ============================================
  fetchSavingsGoals: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('monexa_savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ savingsGoals: data || [] })
    } catch (error) {
      set({ error: error.message })
    }
  },

  addSavingsGoal: async (goal) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }
    try {
      const { data, error } = await supabase
        .from('monexa_savings_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      set({ savingsGoals: [data, ...get().savingsGoals] })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateSavingsGoal: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('monexa_savings_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set({ savingsGoals: get().savingsGoals.map((g) => (g.id === id ? data : g)) })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Nạp thêm vào mục tiêu tiết kiệm
  depositSavings: async (id, amount) => {
    const goal = get().savingsGoals.find((g) => g.id === id)
    if (!goal) return { success: false, error: 'Không tìm thấy mục tiêu' }
    const newAmount = Number(goal.current_amount) + Number(amount)
    const isCompleted = newAmount >= Number(goal.target_amount)
    return get().updateSavingsGoal(id, {
      current_amount: newAmount,
      is_completed: isCompleted,
    })
  },

  // Rút từ mục tiêu tiết kiệm
  withdrawSavings: async (id, amount) => {
    const goal = get().savingsGoals.find((g) => g.id === id)
    if (!goal) return { success: false, error: 'Không tìm thấy mục tiêu' }
    const newAmount = Math.max(0, Number(goal.current_amount) - Number(amount))
    return get().updateSavingsGoal(id, {
      current_amount: newAmount,
      is_completed: false,
    })
  },

  deleteSavingsGoal: async (id) => {
    try {
      const { error } = await supabase.from('monexa_savings_goals').delete().eq('id', id)
      if (error) throw error
      set({ savingsGoals: get().savingsGoals.filter((g) => g.id !== id) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // ============================================
  // TRANSACTIONS
  // ============================================
  fetchTransactions: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('monexa_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      set({ transactions: data || [], loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Thêm transaction
  addTransaction: async (transaction) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }

    try {
      const { data, error } = await supabase
        .from('monexa_expenses')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      set({ transactions: [data, ...get().transactions] })
      // Cập nhật balance ví
      if (transaction.wallet_id) {
        await get()._adjustWalletBalance(transaction.wallet_id, transaction)
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Cập nhật transaction
  updateTransaction: async (id, updates) => {
    const old = get().transactions.find((t) => t.id === id)
    try {
      const { data, error } = await supabase
        .from('monexa_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      set({
        transactions: get().transactions.map((t) => (t.id === id ? data : t)),
      })
      // Cập nhật lại balance ví: hoàn tác giao dịch cũ + áp dụng giao dịch mới
      if (old?.wallet_id) {
        await get()._adjustWalletBalance(old.wallet_id, {
          ...old,
          type: old.type === 'thu_nhap' ? 'chi_tieu' : 'thu_nhap',
        })
      }
      if (data.wallet_id && data.wallet_id !== old?.wallet_id) {
        await get()._adjustWalletBalance(data.wallet_id, data)
      } else if (data.wallet_id === old?.wallet_id) {
        await get()._adjustWalletBalance(data.wallet_id, data)
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Helper: điều chỉnh số dư ví
  _adjustWalletBalance: async (walletId, transaction) => {
    const wallet = get().wallets.find((w) => w.id === walletId)
    if (!wallet) return
    const delta =
      transaction.type === 'thu_nhap' ? Number(transaction.amount) : -Number(transaction.amount)
    await get().updateWallet(walletId, {
      balance: Number(wallet.balance) + delta,
    })
  },

  // Xóa transaction
  deleteTransaction: async (id) => {
    try {
      const t = get().transactions.find((x) => x.id === id)
      const { error } = await supabase.from('monexa_expenses').delete().eq('id', id)
      if (error) throw error
      set({
        transactions: get().transactions.filter((x) => x.id !== id),
      })
      // Hoàn tác balance ví
      if (t?.wallet_id) {
        await get()._adjustWalletBalance(t.wallet_id, {
          ...t,
          type: t.type === 'thu_nhap' ? 'chi_tieu' : 'thu_nhap',
        })
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Tính toán stats trong tháng
  getMonthStats: () => {
    const { transactions } = get()
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const totalIncome = monthTransactions
      .filter((t) => t.type === 'thu_nhap')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpense = monthTransactions
      .filter((t) => t.type === 'chi_tieu')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: monthTransactions.length,
    }
  },

  // Thống kê theo danh mục chi tiêu
  getCategoryStats: () => {
    const { transactions } = get()
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const stats = {}
    transactions
      .filter((t) => {
        const d = new Date(t.date)
        return (
          t.type === 'chi_tieu' &&
          d.getMonth() === month &&
          d.getFullYear() === year
        )
      })
      .forEach((t) => {
        if (!stats[t.category]) stats[t.category] = 0
        stats[t.category] += Number(t.amount)
      })
    return Object.entries(stats)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  },

  // Thống kê 6 tháng gần nhất
  getMonthlyTrend: (months = 6) => {
    const { transactions } = get()
    const result = []
    const now = new Date()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const monthTrans = transactions.filter((t) => {
        const td = new Date(t.date)
        return td.getMonth() === month && td.getFullYear() === year
      })
      result.push({
        month: `T${month + 1}`,
        label: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
        income: monthTrans
          .filter((t) => t.type === 'thu_nhap')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        expense: monthTrans
          .filter((t) => t.type === 'chi_tieu')
          .reduce((sum, t) => sum + Number(t.amount), 0),
      })
    }
    return result
  },
}))