import { useEffect, useState } from 'react'
import { useMonexaStore } from '../../stores/monexaStore'
import Modal from '../../components/common/Modal'
import { Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, Wallet, Filter } from 'lucide-react'
import { formatCurrency, formatDateFull, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/Spinner'

const TYPE_LABELS = { thu_nhap: 'Thu nhập', chi_tieu: 'Chi tiêu' }

export default function MonexaApp() {
  const { transactions, loading, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, getMonthStats } =
    useMonexaStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const stats = getMonthStats()

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    if (search && !`${t.note} ${t.category}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSubmit = async (data) => {
    if (editing) {
      await updateTransaction(editing.id, data)
    } else {
      await addTransaction(data)
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleEdit = (t) => {
    setEditing(t)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (confirmId) {
      await deleteTransaction(confirmId)
      setConfirmId(null)
    }
  }

  const summaryCards = [
    {
      label: 'Tổng thu',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Tổng chi',
      value: stats.totalExpense,
      icon: TrendingDown,
      color: 'red',
    },
    {
      label: 'Số dư',
      value: stats.balance,
      icon: Wallet,
      color: stats.balance >= 0 ? 'blue' : 'orange',
    },
  ]

  const allCategories = [...new Set([...EXPENSE_CATEGORIES.map(c => c.value), ...INCOME_CATEGORIES.map(c => c.value)])]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monexa</h1>
          <p className="text-sm text-slate-500">Quản lý chi tiêu cá nhân</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Thêm giao dịch
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const colors = {
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            red: 'bg-red-50 text-red-700 border-red-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
          }
          return (
            <div key={card.label} className={`card p-5 border ${colors[card.color]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(card.value)}</p>
                </div>
                <Icon size={28} className="opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-40"
          >
            <option value="all">Tất cả loại</option>
            <option value="thu_nhap">Thu nhập</option>
            <option value="chi_tieu">Chi tiêu</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input md:w-44"
          >
            <option value="all">Tất cả danh mục</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Chưa có giao dịch nào"
            description="Bắt đầu thêm giao dịch thu chi của bạn để theo dõi tài chính"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const isIncome = t.type === 'thu_nhap'
              const catObj = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.value === t.category)
              return (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: `${catObj?.color}20` }}
                    >
                      {catObj?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 truncate">
                          {catObj?.label || t.category}
                        </span>
                        <span className={`badge ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                      </div>
                      {t.note && <p className="text-sm text-slate-500 truncate mt-0.5">{t.note}</p>}
                      <p className="text-xs text-slate-400 mt-1">{formatDateFull(t.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmId(t.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmId}
        title="Xóa giao dịch?"
        message="Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

function TransactionModal({ open, onClose, onSubmit, editing }) {
  const [type, setType] = useState('chi_tieu')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('an_uong')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCategory(editing.category)
      setDate(editing.date)
      setNote(editing.note || '')
    } else {
      setType('chi_tieu')
      setAmount('')
      setCategory('an_uong')
      setDate(new Date().toISOString().slice(0, 10))
      setNote('')
    }
  }, [editing, open])

  const categories = type === 'thu_nhap' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    if (!categories.find((c) => c.value === category)) {
      setCategory(categories[0].value)
    }
  }, [type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        category,
        date,
        note,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('chi_tieu')}
              className={`py-2.5 rounded-lg border-2 font-medium transition-all ${
                type === 'chi_tieu'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setType('thu_nhap')}
              className={`py-2.5 rounded-lg border-2 font-medium transition-all ${
                type === 'thu_nhap'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Thu nhập
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền (₫)</label>
          <input
            type="number"
            required
            min="0"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Danh mục</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`p-2 rounded-lg border-2 transition-all text-center ${
                  category === c.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xl mb-0.5">{c.icon}</div>
                <div className="text-xs text-slate-600 truncate">{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder="VD: Cơm trưa với đồng nghiệp"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}