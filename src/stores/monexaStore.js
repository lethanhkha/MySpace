import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export const useMonexaStore = create((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  // Fetch tất cả transactions của user hiện tại
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
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Cập nhật transaction
  updateTransaction: async (id, updates) => {
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
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Xóa transaction
  deleteTransaction: async (id) => {
    try {
      const { error } = await supabase.from('monexa_expenses').delete().eq('id', id)
      if (error) throw error
      set({
        transactions: get().transactions.filter((t) => t.id !== id),
      })
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
}))