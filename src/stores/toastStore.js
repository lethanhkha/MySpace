import { create } from 'zustand'

let _id = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = ++_id
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }))
    setTimeout(() => get().removeToast(id), duration)
    return id
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  success: (message, duration) => get().addToast('success', message, duration),
  error: (message, duration) => get().addToast('error', message, duration),
  info: (message, duration) => get().addToast('info', message, duration),
}))
