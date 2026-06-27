import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMonexaStore } from '../stores/monexaStore'
import { useNixioStore } from '../stores/nixioStore'
import { useNoteraStore } from '../stores/noteraStore'
import { Wallet, CheckSquare, StickyNote, ArrowRight, TrendingUp, TrendingDown, ListTodo, FileText } from 'lucide-react'
import { formatCurrency, getCurrentMonthLabel } from '../lib/helpers'

export default function HubDashboard() {
  const { user } = useAuthStore()
  const { transactions, fetchTransactions: fetchMoney, getMonthStats } = useMonexaStore()
  const { tasks, fetchTasks, getTaskStats } = useNixioStore()
  const { notes, fetchNotes } = useNoteraStore()

  useEffect(() => {
    fetchMoney()
    fetchTasks()
    fetchNotes()
  }, [])

  const moneyStats = getMonthStats()
  const taskStats = getTaskStats()
  const greetingTime = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  })()

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn'

  const apps = [
    {
      key: 'monexa',
      title: 'Monexa',
      subtitle: 'Quản lý chi tiêu',
      description: 'Theo dõi thu chi, phân tích tài chính cá nhân thông minh',
      icon: Wallet,
      color: 'monexa',
      gradient: 'from-emerald-400 to-emerald-600',
      bg: 'bg-emerald-50',
      hoverBorder: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-500',
      link: '/hub/monexa',
    },
    {
      key: 'nixio',
      title: 'Nixio',
      subtitle: 'Quản lý công việc',
      description: 'Sắp xếp task, theo dõi tiến độ với Kanban board trực quan',
      icon: CheckSquare,
      color: 'nixio',
      gradient: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50',
      hoverBorder: 'hover:border-blue-300',
      iconBg: 'bg-blue-500',
      link: '/hub/nixio',
    },
    {
      key: 'notera',
      title: 'Notera',
      subtitle: 'Ghi chú cá nhân',
      description: 'Lưu trữ ý tưởng, ghi chú nhanh với rich text editor',
      icon: StickyNote,
      color: 'notera',
      gradient: 'from-amber-400 to-amber-600',
      bg: 'bg-amber-50',
      hoverBorder: 'hover:border-amber-300',
      iconBg: 'bg-amber-500',
      link: '/hub/notera',
    },
  ]

  const quickStats = [
    {
      label: 'Thu nhập tháng',
      value: formatCurrency(moneyStats.totalIncome),
      icon: TrendingUp,
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Chi tiêu tháng',
      value: formatCurrency(moneyStats.totalExpense),
      icon: TrendingDown,
      color: 'red',
      bg: 'bg-red-50',
      text: 'text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Task đang làm',
      value: taskStats.inProgress,
      icon: ListTodo,
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Ghi chú',
      value: notes.length,
      icon: FileText,
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <p className="text-primary-100 text-sm font-medium">{greetingTime},</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{fullName} 👋</h1>
        <p className="text-primary-100 mt-2 max-w-xl">
          Chúc bạn một ngày tuyệt vời. Đây là bảng điều khiển trung tâm của MySpace — chọn một ứng dụng bên dưới để bắt đầu.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`card p-4 ${stat.bg} border-transparent`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 ${stat.text}`}>{stat.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.text} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{getCurrentMonthLabel()}</p>
            </div>
          )
        })}
      </div>

      {/* Apps Navigation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Ứng dụng của bạn</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <Link
                key={app.key}
                to={app.link}
                className={`group card p-6 ${app.hoverBorder} hover:-translate-y-1 transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-md`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{app.title}</h3>
                <p className="text-sm text-slate-500 font-medium">{app.subtitle}</p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{app.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}