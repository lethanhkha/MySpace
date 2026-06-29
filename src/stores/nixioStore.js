import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export const useNixioStore = create((set, get) => ({
  tasks: [],
  projects: [],
  loading: false,
  error: null,

  // ============================================
  // PROJECTS
  // ============================================
  fetchProjects: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('nixio_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ projects: data || [] })
    } catch (error) {
      set({ error: error.message })
    }
  },

  addProject: async (project) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }
    try {
      const { data, error } = await supabase
        .from('nixio_projects')
        .insert([{ ...project, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      set({ projects: [data, ...get().projects] })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('nixio_projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set({ projects: get().projects.map((p) => (p.id === id ? data : p)) })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  deleteProject: async (id) => {
    try {
      const { error } = await supabase.from('nixio_projects').delete().eq('id', id)
      if (error) throw error
      set({ projects: get().projects.filter((p) => p.id !== id) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Tính % tiến độ project
  getProjectProgress: (projectId) => {
    const { tasks } = get()
    const projectTasks = tasks.filter((t) => t.project_id === projectId)
    if (projectTasks.length === 0) return { total: 0, done: 0, percent: 0 }
    const done = projectTasks.filter((t) => t.status === 'done').length
    return {
      total: projectTasks.length,
      done,
      percent: Math.round((done / projectTasks.length) * 100),
    }
  },

  // ============================================
  // TASKS
  // ============================================
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