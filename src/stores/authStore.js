import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  // Initialize - check current session
  init: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      })

      // Listen to auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Auth init error:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Login with email/password
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      set({ user: data.user, session: data.session, loading: false })
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Register with email/password
  register: async (email, password, fullName) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error

      // Tạo profile nếu user đã được tạo ngay
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || '',
        })
      }

      // Nếu Supabase bật "Confirm email", session sẽ null
      // Nếu tắt, session có sẵn → vào app luôn
      const needsEmailConfirm = !data.session
      set({
        user: data.user,
        session: data.session,
        loading: false
      })
      return { success: true, needsEmailConfirm }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Logout
  logout: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Reset password
  resetPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      set({ loading: false })
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Gửi lại email xác nhận
  resendConfirmation: async () => {
    const currentUser = get().user
    if (!currentUser?.email) return { success: false, error: 'Chưa có email' }
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
      })
      if (error) throw error
      set({ loading: false })
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Kiểm tra email đã xác nhận chưa
  isEmailConfirmed: () => {
    const { user } = get()
    return !!user?.email_confirmed_at
  },

  // Refresh user (gọi sau khi click link xác nhận)
  refreshUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      set({ user })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    try {
      const user = get().user
      if (!user) throw new Error('Chưa đăng nhập')
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  clearError: () => set({ error: null }),
}))