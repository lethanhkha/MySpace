import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export const useNixioStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  // Fetch tất cả tasks
  fetchTasks: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('nixio_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ tasks: data || [], loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Thêm task
  addTask: async (task) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }

    try {
      const { data, error } = await supabase
        .from('nixio_tasks')
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      set({ tasks: [data, ...get().tasks] })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Cập nhật task
  updateTask: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('nixio_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      set({
        tasks: get().tasks.map((t) => (t.id === id ? data : t)),
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Move task (chuyển trạng thái)
  moveTask: async (id, newStatus) => {
    return get().updateTask(id, { status: newStatus })
  },

  // Xóa task
  deleteTask: async (id) => {
    try {
      const { error } = await supabase.from('nixio_tasks').delete().eq('id', id)
      if (error) throw error
      set({
        tasks: get().tasks.filter((t) => t.id !== id),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Đếm tasks theo status
  getTaskStats: () => {
    const { tasks } = get()
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }
  },
}))