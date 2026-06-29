import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'

export const useNoteraStore = create((set, get) => ({
  notes: [],
  selectedNoteId: null,
  loading: false,
  error: null,

  // Fetch tất cả notes
  fetchNotes: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('notera_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error
      set({ notes: data || [], loading: false })

      // Auto-select note đầu tiên nếu chưa có
      if (data && data.length > 0 && !get().selectedNoteId) {
        set({ selectedNoteId: data[0].id })
      }
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Thêm note
  addNote: async (note = {}) => {
    const user = useAuthStore.getState().user
    if (!user) return { success: false, error: 'Chưa đăng nhập' }

    try {
      const { data, error } = await supabase
        .from('notera_notes')
        .insert([
          {
            title: note.title || 'Ghi chú mới',
            content: note.content || '',
            color: note.color || '#fef3c7',
            tags: note.tags || [],
            is_pinned: false,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      set({
        notes: [data, ...get().notes],
        selectedNoteId: data.id,
      })
      useToastStore.getState().success('Đã tạo ghi chú mới')
      return { success: true, data }
    } catch (error) {
      useToastStore.getState().error('Tạo ghi chú thất bại')
      return { success: false, error: error.message }
    }
  },

  // Cập nhật note
  updateNote: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('notera_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      set({
        notes: get().notes.map((n) => (n.id === id ? data : n)),
      })
      return { success: true, data }
    } catch (error) {
      useToastStore.getState().error('Lưu ghi chú thất bại')
      return { success: false, error: error.message }
    }
  },

  // Toggle pin
  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    return get().updateNote(id, { is_pinned: !note.is_pinned })
  },

  // Xóa note
  deleteNote: async (id) => {
    try {
      const { error } = await supabase.from('notera_notes').delete().eq('id', id)
      if (error) throw error
      const remaining = get().notes.filter((n) => n.id !== id)
      set({
        notes: remaining,
        selectedNoteId: get().selectedNoteId === id ? remaining[0]?.id ?? null : get().selectedNoteId,
      })
      useToastStore.getState().success('Đã xóa ghi chú')
      return { success: true }
    } catch (error) {
      useToastStore.getState().error('Xóa ghi chú thất bại')
      return { success: false, error: error.message }
    }
  },

  // Set selected note
  selectNote: (id) => set({ selectedNoteId: id }),

  // Lấy note đang được chọn
  getSelectedNote: () => {
    const { notes, selectedNoteId } = get()
    return notes.find((n) => n.id === selectedNoteId) || null
  },
}))