import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

// Format tiền tệ VND
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num)
}

// Format ngày thân thiện
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  if (isToday(date)) return 'Hôm nay'
  if (isYesterday(date)) return 'Hôm qua'
  return format(date, 'dd/MM/yyyy')
}

// Format ngày đầy đủ
export const formatDateFull = (dateStr) => {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(date, 'dd/MM/yyyy')
}

// Format datetime
export const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(date, 'dd/MM/yyyy HH:mm')
}

// Lấy ngày đầu tháng
export const getMonthRange = (date = new Date()) => {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

// Lấy ngày trong ngày
export const getDayRange = (date = new Date()) => {
  return {
    start: format(startOfDay(date), 'yyyy-MM-dd'),
    end: format(endOfDay(date), 'yyyy-MM-dd'),
  }
}

// Lấy nhãn tháng hiện tại
export const getCurrentMonthLabel = () => {
  return format(new Date(), 'MMMM yyyy')
}

// Random màu cho note
export const NOTE_COLORS = [
  { name: 'yellow', bg: '#fef3c7', border: '#fcd34d' },
  { name: 'green', bg: '#d1fae5', border: '#34d399' },
  { name: 'blue', bg: '#dbeafe', border: '#60a5fa' },
  { name: 'purple', bg: '#ede9fe', border: '#a78bfa' },
  { name: 'pink', bg: '#fce7f3', border: '#f472b6' },
  { name: 'white', bg: '#ffffff', border: '#e5e7eb' },
]

// Danh mục chi tiêu mặc định
export const EXPENSE_CATEGORIES = [
  { value: 'an_uong', label: 'Ăn uống', icon: '🍜', color: '#f97316' },
  { value: 'di_chuyen', label: 'Di chuyển', icon: '🚗', color: '#3b82f6' },
  { value: 'mua_sam', label: 'Mua sắm', icon: '🛍️', color: '#ec4899' },
  { value: 'giai_tri', label: 'Giải trí', icon: '🎮', color: '#8b5cf6' },
  { value: 'y_te', label: 'Y tế', icon: '💊', color: '#ef4444' },
  { value: 'hoa_don', label: 'Hóa đơn', icon: '🧾', color: '#64748b' },
  { value: 'hoc_tap', label: 'Học tập', icon: '📚', color: '#0ea5e9' },
  { value: 'khac', label: 'Khác', icon: '📦', color: '#94a3b8' },
]

// Danh mục thu nhập mặc định
export const INCOME_CATEGORIES = [
  { value: 'luong', label: 'Lương', icon: '💰', color: '#10b981' },
  { value: 'thuong', label: 'Thưởng', icon: '🎁', color: '#22c55e' },
  { value: 'dau_tu', label: 'Đầu tư', icon: '📈', color: '#06b6d4' },
  { value: 'phu_thu', label: 'Phụ thu', icon: '💵', color: '#84cc16' },
  { value: 'khac', label: 'Khác', icon: '📦', color: '#94a3b8' },
]

// Priority colors
export const PRIORITY_COLORS = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  high: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}

export const PRIORITY_LABELS = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
}

export const STATUS_LABELS = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
}

export const STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

// Truncate text
export const truncate = (text, length = 100) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Strip HTML
export const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}