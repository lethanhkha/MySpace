import { useEffect, useState } from 'react'
import { useMonexaStore } from '../../stores/monexaStore'
import Modal from '../../components/common/Modal'
import {
  Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, Wallet,
  LayoutDashboard, ListChecks, PiggyBank, BarChart3, Target, Minus, Coins,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import {
  formatCurrency, formatDateFull, EXPENSE_CATEGORIES, INCOME_CATEGORIES,
} from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/Spinner'
import CountUpRaw from 'react-countup/build/index.js'
const CountUp = CountUpRaw.default || CountUpRaw
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_LABELS = { thu_nhap: 'Thu nhập', chi_tieu: 'Chi tiêu' }

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'transactions', label: 'Giao dịch', icon: ListChecks },
  { id: 'wallets', label: 'Ví', icon: Wallet },
  { id: 'budgets', label: 'Ngân sách', icon: Target },
  { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
]

const WALLET_TYPES = [
  { value: 'cash', label: 'Tiền mặt', icon: '💵', defaultColor: '#10b981' },
  { value: 'bank', label: 'Ngân hàng', icon: '🏦', defaultColor: '#3b82f6' },
  { value: 'card', label: 'Thẻ tín dụng', icon: '💳', defaultColor: '#ef4444' },
  { value: 'ewallet', label: 'Ví điện tử', icon: '📱', defaultColor: '#8b5cf6' },
  { value: 'other', label: 'Khác', icon: '📦', defaultColor: '#64748b' },
]

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7']

export default function MonexaApp() {
  const {
    transactions, wallets, budgets, savingsGoals,
    loading,
    fetchTransactions, fetchWallets, fetchBudgets, fetchSavingsGoals,
    addTransaction, updateTransaction, deleteTransaction,
    addWallet, updateWallet, deleteWallet,
    addBudget, updateBudget, deleteBudget,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, depositSavings, withdrawSavings,
    getMonthStats, getCategoryStats, getMonthlyTrend, getBudgetProgress,
  } = useMonexaStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [editingSavings, setEditingSavings] = useState(null)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [depositGoal, setDepositGoal] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [coinDrop, setCoinDrop] = useState(null) // null | 'income' | 'expense'
  const [confirm, setConfirm] = useState(null) // { id, type }

  useEffect(() => {
    fetchTransactions()
    fetchWallets()
    fetchBudgets()
    fetchSavingsGoals()
  }, [])

  // ====== Handlers tổng ======
  const askConfirm = (id, type, label) => setConfirm({ id, type, label })

  // ====== Render tab ======
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            stats={getMonthStats()}
            categoryStats={getCategoryStats()}
            monthlyTrend={getMonthlyTrend(6)}
            wallets={wallets}
            savingsGoals={savingsGoals}
          />
        )
      case 'transactions':
        return (
          <TransactionsTab
            transactions={transactions}
            wallets={wallets}
            filterType={filterType}
            setFilterType={setFilterType}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            search={search}
            setSearch={setSearch}
            onAdd={() => { setEditingTx(null); setTxModalOpen(true) }}
            onEdit={(t) => { setEditingTx(t); setTxModalOpen(true) }}
            onDelete={(id) => askConfirm(id, 'transaction', 'giao dịch')}
            loading={loading}
          />
        )
      case 'wallets':
        return (
          <WalletsTab
            wallets={wallets}
            transactions={transactions}
            onAdd={() => { setEditingWallet(null); setWalletModalOpen(true) }}
            onEdit={(w) => { setEditingWallet(w); setWalletModalOpen(true) }}
            onDelete={(id) => askConfirm(id, 'wallet', 'ví')}
          />
        )
      case 'budgets':
        return (
          <BudgetsTab
            budgets={budgets}
            transactions={transactions}
            getBudgetProgress={getBudgetProgress}
            onAdd={() => { setEditingBudget(null); setBudgetModalOpen(true) }}
            onEdit={(b) => { setEditingBudget(b); setBudgetModalOpen(true) }}
            onDelete={(id) => askConfirm(id, 'budget', 'ngân sách')}
          />
        )
      case 'savings':
        return (
          <SavingsTab
            savingsGoals={savingsGoals}
            onAdd={() => { setEditingSavings(null); setSavingsModalOpen(true) }}
            onEdit={(g) => { setEditingSavings(g); setSavingsModalOpen(true) }}
            onDelete={(id) => askConfirm(id, 'savings', 'mục tiêu')}
            onDeposit={(g) => { setDepositGoal(g); setDepositModalOpen(true) }}
          />
        )
      case 'reports':
        return <ReportsTab transactions={transactions} wallets={wallets} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monexa</h1>
          <p className="text-sm text-slate-500">Quản lý tài chính cá nhân</p>
        </div>
        <button
          onClick={() => { setEditingTx(null); setTxModalOpen(true) }}
          className="btn-primary"
        >
          <Plus size={18} />
          Thêm giao dịch
        </button>
      </div>

      {/* Tab bar */}
      <div className="card p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {renderTab()}

      {/* Modals */}
      <TransactionModal
        open={txModalOpen}
        onClose={() => { setTxModalOpen(false); setEditingTx(null) }}
        onSubmit={async (data) => {
          if (editingTx) await updateTransaction(editingTx.id, data)
          else {
            await addTransaction(data)
            const kind = data.type === 'thu_nhap' ? 'income' : 'expense'
            setCoinDrop(kind)
            setTimeout(() => setCoinDrop(null), 900)
          }
          setTxModalOpen(false); setEditingTx(null)
        }}
        editing={editingTx}
        wallets={wallets}
      />

      <WalletModal
        open={walletModalOpen}
        onClose={() => { setWalletModalOpen(false); setEditingWallet(null) }}
        onSubmit={async (data) => {
          if (editingWallet) await updateWallet(editingWallet.id, data)
          else await addWallet(data)
          setWalletModalOpen(false); setEditingWallet(null)
        }}
        editing={editingWallet}
      />

      <BudgetModal
        open={budgetModalOpen}
        onClose={() => { setBudgetModalOpen(false); setEditingBudget(null) }}
        onSubmit={async (data) => {
          if (editingBudget) await updateBudget(editingBudget.id, data)
          else await addBudget(data)
          setBudgetModalOpen(false); setEditingBudget(null)
        }}
        editing={editingBudget}
      />

      <SavingsModal
        open={savingsModalOpen}
        onClose={() => { setSavingsModalOpen(false); setEditingSavings(null) }}
        onSubmit={async (data) => {
          if (editingSavings) await updateSavingsGoal(editingSavings.id, data)
          else await addSavingsGoal(data)
          setSavingsModalOpen(false); setEditingSavings(null)
        }}
        editing={editingSavings}
      />

      <DepositWithdrawModal
        open={depositModalOpen}
        goal={depositGoal}
        onClose={() => { setDepositModalOpen(false); setDepositGoal(null) }}
        onDeposit={async (id, amount) => {
          await depositSavings(id, amount)
          setDepositModalOpen(false); setDepositGoal(null)
        }}
        onWithdraw={async (id, amount) => {
          await withdrawSavings(id, amount)
          setDepositModalOpen(false); setDepositGoal(null)
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        title={`Xóa ${confirm?.label || ''}?`}
        message="Hành động này không thể hoàn tác."
        onConfirm={async () => {
          if (!confirm) return
          if (confirm.type === 'transaction') await deleteTransaction(confirm.id)
          else if (confirm.type === 'wallet') await deleteWallet(confirm.id)
          else if (confirm.type === 'budget') await deleteBudget(confirm.id)
          else if (confirm.type === 'savings') await deleteSavingsGoal(confirm.id)
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />

      {/* Coin drop animation */}
      <AnimatePresence>
        {coinDrop && (
          <motion.div
            key="coindrop"
            initial={{ y: -40, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-20 right-8 z-[60] pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Coins size={18} />
              <span className="text-sm font-semibold">
                {coinDrop === 'income' ? '+ Thu nhập mới' : '- Chi tiêu mới'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// TAB: Overview
// ============================================
function OverviewTab({ stats, categoryStats, monthlyTrend, wallets, savingsGoals }) {
  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0)
  const topCats = categoryStats.slice(0, 3)
  const activeSavings = savingsGoals.filter((g) => !g.is_completed).length

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Tổng số dư" value={formatCurrency(totalBalance)} icon={Wallet} color="blue" rawNumber={totalBalance} />
        <SummaryCard label="Thu nhập tháng" value={formatCurrency(stats.totalIncome)} icon={TrendingUp} color="emerald" rawNumber={stats.totalIncome} />
        <SummaryCard label="Chi tiêu tháng" value={formatCurrency(stats.totalExpense)} icon={TrendingDown} color="red" rawNumber={stats.totalExpense} />
        <SummaryCard
          label="Tiết kiệm đang chạy"
          value={activeSavings}
          icon={PiggyBank}
          color="purple"
          isNumber
          rawNumber={activeSavings}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend 6 tháng */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3">Thu chi 6 tháng gần nhất</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 danh mục */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Top chi tiêu tháng</h3>
          {topCats.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-8 text-center">Chưa có dữ liệu chi tiêu</p>
          ) : (
            <div className="space-y-3">
              {topCats.map((c, i) => {
                const cat = EXPENSE_CATEGORIES.find((x) => x.value === c.category)
                const percent = stats.totalExpense > 0 ? Math.round((c.amount / stats.totalExpense) * 100) : 0
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{cat?.icon || '📦'}</span>
                        <span className="text-slate-700 truncate">{cat?.label || c.category}</span>
                      </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: PIE_COLORS[i],
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{percent}% tổng chi</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wallets overview */}
      {wallets.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Ví của bạn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-lg border-l-4"
                style={{ borderLeftColor: w.color, backgroundColor: `${w.color}10` }}
              >
                <p className="text-xs text-slate-500">{WALLET_TYPES.find((t) => t.value === w.type)?.label}</p>
                <p className="font-medium text-slate-900 truncate">{w.name}</p>
                <p className="text-lg font-bold mt-1" style={{ color: w.color }}>
                  {formatCurrency(w.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color, isNumber, rawNumber }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`stat-card stagger-item card-hover card p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className={`font-bold mt-1 ${isNumber ? 'text-3xl' : 'text-xl'}`}>
            {rawNumber != null ? (
              isNumber ? (
                <CountUp end={rawNumber} duration={0.7} preserveValue />
              ) : (
                <CountUp
                  end={rawNumber}
                  duration={0.7}
                  preserveValue
                  decimals={0}
                  formattingFn={(val) => formatCurrency(Math.round(val))}
                />
              )
            ) : (
              value
            )}
          </p>
        </div>
        <Icon size={28} className="opacity-50" />
      </div>
    </div>
  )
}

// ============================================
// TAB: Transactions
// ============================================
function TransactionsTab({
  transactions, wallets,
  filterType, setFilterType, filterCategory, setFilterCategory,
  search, setSearch, onAdd, onEdit, onDelete, loading,
}) {
  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    if (search && !`${t.note} ${t.category}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input md:w-40">
            <option value="all">Tất cả loại</option>
            <option value="thu_nhap">Thu nhập</option>
            <option value="chi_tieu">Chi tiêu</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input md:w-44">
            <option value="all">Tất cả danh mục</option>
            {[...EXPENSE_CATEGORIES.map((c) => c.value), ...INCOME_CATEGORIES.map((c) => c.value)].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={onAdd} className="btn-primary md:w-auto">
            <Plus size={16} /> Thêm
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="Chưa có giao dịch nào" description="Bắt đầu thêm giao dịch thu chi của bạn" />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const isIncome = t.type === 'thu_nhap'
              const catObj = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.value === t.category)
              const wallet = wallets.find((w) => w.id === t.wallet_id)
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
                        <span className="font-medium text-slate-900 truncate">{catObj?.label || t.category}</span>
                        <span className={`badge ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                        {wallet && (
                          <span
                            className="badge text-slate-700"
                            style={{ backgroundColor: `${wallet.color}20` }}
                          >
                            {wallet.name}
                          </span>
                        )}
                      </div>
                      {t.note && <p className="text-sm text-slate-500 truncate mt-0.5">{t.note}</p>}
                      <p className="text-xs text-slate-400 mt-1">{formatDateFull(t.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-600">
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
    </div>
  )
}

// ============================================
// TAB: Wallets
// ============================================
function WalletsTab({ wallets, transactions, onAdd, onEdit, onDelete }) {
  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0)

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{wallets.length} ví</h3>
          <p className="text-sm text-slate-500">Tổng số dư: <span className="font-semibold text-primary-700">{formatCurrency(totalBalance)}</span></p>
        </div>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> Thêm ví
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title="Chưa có ví nào"
            description="Tạo ví để phân loại các giao dịch theo tài khoản"
            action={
              <button onClick={onAdd} className="btn-primary">
                <Plus size={16} /> Tạo ví đầu tiên
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((w) => {
            const tCount = transactions.filter((t) => t.wallet_id === w.id).length
            const type = WALLET_TYPES.find((t) => t.value === w.type)
            return (
              <div key={w.id} className="card p-5 group" style={{ borderLeft: `4px solid ${w.color}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{type?.label}</p>
                    <h4 className="font-semibold text-slate-900 mt-0.5">{w.name}</h4>
                  </div>
                  <span className="text-2xl">{type?.icon}</span>
                </div>
                <p className="text-2xl font-bold mt-3" style={{ color: w.color }}>
                  {formatCurrency(w.balance)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{tCount} giao dịch</p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(w)} className="flex-1 text-xs py-1.5 px-3 hover:bg-slate-100 rounded text-slate-600">
                    <Edit2 size={12} className="inline mr-1" /> Sửa
                  </button>
                  <button onClick={() => onDelete(w.id)} className="flex-1 text-xs py-1.5 px-3 hover:bg-red-50 rounded text-red-600">
                    <Trash2 size={12} className="inline mr-1" /> Xóa
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB: Budgets
// ============================================
function BudgetsTab({ budgets, transactions, getBudgetProgress, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Ngân sách theo danh mục</h3>
          <p className="text-sm text-slate-500">Đặt giới hạn chi tiêu để kiểm soát tài chính</p>
        </div>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> Thêm ngân sách
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="card">
          <EmptyState icon={Target} title="Chưa có ngân sách" description="Tạo ngân sách cho từng danh mục để kiểm soát chi tiêu" action={
            <button onClick={onAdd} className="btn-primary"><Plus size={16} /> Tạo ngân sách</button>
          } />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.value === b.category)
            const prog = getBudgetProgress(b.id)
            const isWarning = prog.percent >= 80
            const isOver = prog.percent >= 100
            return (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat?.icon || '📦'}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{cat?.label || b.category}</h4>
                      <p className="text-xs text-slate-500">{b.period === 'monthly' ? 'Hàng tháng' : b.period === 'yearly' ? 'Hàng năm' : 'Hàng tuần'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(b)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(b.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-700">Đã chi: <strong className={isOver ? 'text-red-600' : 'text-slate-900'}>{formatCurrency(prog.spent)}</strong></span>
                  <span className="text-slate-500">/{formatCurrency(b.amount)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${prog.percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className={`font-semibold ${
                    isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {prog.percent}% {isOver && '- Vượt mức!'}
                  </span>
                  <span className="text-slate-500">Còn lại: {formatCurrency(prog.remaining)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB: Savings
// ============================================
function SavingsTab({ savingsGoals, onAdd, onEdit, onDelete, onDeposit }) {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Mục tiêu tiết kiệm</h3>
          <p className="text-sm text-slate-500">Đặt mục tiêu và theo dõi tiến độ</p>
        </div>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> Thêm mục tiêu
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PiggyBank}
            title="Chưa có mục tiêu tiết kiệm"
            description="Tạo mục tiêu như mua xe, mua nhà, du lịch..."
            action={
              <button onClick={onAdd} className="btn-primary"><Plus size={16} /> Tạo mục tiêu</button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((g) => {
            const percent = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100))
            const isDone = g.is_completed || percent >= 100
            return (
              <div
                key={g.id}
                className="card p-5 group relative overflow-hidden"
                style={{ borderTop: `4px solid ${g.color}` }}
              >
                {isDone && (
                  <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    Hoàn thành!
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg">{g.name}</h4>
                    {g.deadline && (
                      <p className="text-xs text-slate-500 mt-0.5">Deadline: {formatDateFull(g.deadline)}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(g)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(g.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-2xl font-bold" style={{ color: g.color }}>
                    {formatCurrency(g.current_amount)}
                  </p>
                  <p className="text-sm text-slate-500">/ {formatCurrency(g.target_amount)}</p>
                </div>

                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, backgroundColor: g.color }}
                  />
                </div>
                <p className="text-sm font-semibold text-slate-700">{percent}%</p>

                <button
                  onClick={() => onDeposit(g)}
                  className="w-full mt-3 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: g.color }}
                >
                  Nạp / Rút tiền
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB: Reports
// ============================================
function ReportsTab({ transactions, wallets }) {
  const { getMonthlyTrend, getCategoryStats, getMonthStats } = useMonexaStore()
  const monthlyTrend = getMonthlyTrend(6)
  const categoryStats = getCategoryStats()
  const stats = getMonthStats()

  const top10 = [...transactions]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-700 font-medium">Thu nhập tháng</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="card p-4 border border-red-200 bg-red-50">
          <p className="text-sm text-red-700 font-medium">Chi tiêu tháng</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(stats.totalExpense)}</p>
        </div>
        <div className="card p-4 border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700 font-medium">Số dư tháng</p>
          <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-blue-900' : 'text-orange-600'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart 6 tháng */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">So sánh thu chi 6 tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Thu" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Chi" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart theo danh mục */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Chi tiêu theo danh mục tháng này</h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-12 text-center">Chưa có dữ liệu chi tiêu</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.value === entry.category)
                    return cat?.label || entry.category
                  }}
                >
                  {categoryStats.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trend line balance */}
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Số dư 6 tháng gần nhất</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={monthlyTrend.map((m, i, arr) => {
              let bal = 0
              for (let j = 0; j <= i; j++) bal += (arr[j].income - arr[j].expense)
              return { ...m, balance: bal }
            })}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Line type="monotone" dataKey="balance" name="Số dư" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 giao dịch */}
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Top 10 giao dịch lớn nhất</h3>
        {top10.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-8 text-center">Chưa có dữ liệu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Danh mục</th>
                  <th className="py-2 pr-3">Ngày</th>
                  <th className="py-2 pr-3">Loại</th>
                  <th className="py-2 pr-3 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((t, i) => {
                  const cat = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.value === t.category)
                  const isIncome = t.type === 'thu_nhap'
                  return (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{cat?.icon || '📦'}</span>
                          <span className="text-slate-700">{cat?.label || t.category}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-500 text-xs">{formatDateFull(t.date)}</td>
                      <td className="py-2 pr-3">
                        <span className={`badge ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                      </td>
                      <td className={`py-2 pr-3 text-right font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MODALS
// ============================================
function TransactionModal({ open, onClose, onSubmit, editing, wallets }) {
  const [type, setType] = useState('chi_tieu')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('an_uong')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [walletId, setWalletId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setType(editing.type); setAmount(String(editing.amount)); setCategory(editing.category)
      setDate(editing.date); setNote(editing.note || ''); setWalletId(editing.wallet_id || '')
    } else {
      setType('chi_tieu'); setAmount(''); setCategory('an_uong')
      setDate(new Date().toISOString().slice(0, 10)); setNote(''); setWalletId(wallets[0]?.id || '')
    }
  }, [editing, open, wallets])

  const categories = type === 'thu_nhap' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  useEffect(() => {
    if (!categories.find((c) => c.value === category)) setCategory(categories[0].value)
  }, [type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        type, amount: Number(amount), category, date, note,
        wallet_id: walletId || null,
      })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('chi_tieu')} className={`py-2.5 rounded-lg border-2 font-medium ${type === 'chi_tieu' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              Chi tiêu
            </button>
            <button type="button" onClick={() => setType('thu_nhap')} className={`py-2.5 rounded-lg border-2 font-medium ${type === 'thu_nhap' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              Thu nhập
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền (₫)</label>
          <input type="number" required min="0" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Danh mục</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`p-2 rounded-lg border-2 text-center ${category === c.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                <div className="text-xl mb-0.5">{c.icon}</div>
                <div className="text-xs text-slate-600 truncate">{c.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ví</label>
          {wallets.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Bạn chưa có ví nào. Hãy tạo ví trước ở tab "Ví".
            </p>
          ) : (
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="input">
              <option value="">-- Không chọn ví --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function WalletModal({ open, onClose, onSubmit, editing }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setName(editing.name); setType(editing.type); setBalance(String(editing.balance || ''))
      setColor(editing.color || '#10b981')
    } else {
      setName(''); setType('cash'); setBalance(''); setColor('#10b981')
    }
  }, [editing, open])

  useEffect(() => {
    const t = WALLET_TYPES.find((x) => x.value === type)
    if (t && !editing) setColor(t.defaultColor)
  }, [type, editing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ name, type, balance: Number(balance || 0), color })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa ví' : 'Thêm ví'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên ví <span className="text-red-500">*</span></label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="VD: Tiền mặt, VCB, Momo..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại</label>
          <div className="grid grid-cols-5 gap-2">
            {WALLET_TYPES.map((w) => (
              <button key={w.value} type="button" onClick={() => setType(w.value)} className={`p-2 rounded-lg border-2 text-center ${type === w.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                <div className="text-2xl mb-0.5">{w.icon}</div>
                <div className="text-[10px] text-slate-600 truncate">{w.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số dư ban đầu (₫)</label>
          <input type="number" min="0" step="1000" value={balance} onChange={(e) => setBalance(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Màu</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input h-10 p-1" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function BudgetModal({ open, onClose, onSubmit, editing }) {
  const [category, setCategory] = useState('an_uong')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setCategory(editing.category); setAmount(String(editing.amount)); setPeriod(editing.period)
    } else {
      setCategory('an_uong'); setAmount(''); setPeriod('monthly')
    }
  }, [editing, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ category, amount: Number(amount), period, start_date: new Date().toISOString().slice(0, 10) })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa ngân sách' : 'Tạo ngân sách'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Danh mục</label>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {EXPENSE_CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`p-2 rounded-lg border-2 text-center ${category === c.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                <div className="text-xl mb-0.5">{c.icon}</div>
                <div className="text-xs text-slate-600 truncate">{c.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền tối đa (₫) <span className="text-red-500">*</span></label>
          <input type="number" required min="0" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Kỳ hạn</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input">
            <option value="weekly">Hàng tuần</option>
            <option value="monthly">Hàng tháng</option>
            <option value="yearly">Hàng năm</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SavingsModal({ open, onClose, onSubmit, editing }) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState('#10b981')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setName(editing.name); setTargetAmount(String(editing.target_amount))
      setCurrentAmount(String(editing.current_amount || ''))
      setDeadline(editing.deadline || ''); setColor(editing.color || '#10b981')
      setNote(editing.note || '')
    } else {
      setName(''); setTargetAmount(''); setCurrentAmount('0')
      setDeadline(''); setColor('#10b981'); setNote('')
    }
  }, [editing, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name,
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount || 0),
        deadline: deadline || null,
        color,
        note,
      })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa mục tiêu' : 'Tạo mục tiêu tiết kiệm'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên mục tiêu <span className="text-red-500">*</span></label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="VD: Mua xe, Du lịch Nhật..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền mục tiêu (₫) <span className="text-red-500">*</span></label>
          <input type="number" required min="0" step="1000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="input" />
        </div>
        {!editing && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền hiện có</label>
            <input type="number" min="0" step="1000" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="input" placeholder="0" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hạn chót (tùy chọn)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Màu</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input h-10 p-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DepositWithdrawModal({ open, goal, onClose, onDeposit, onWithdraw }) {
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState('deposit')

  useEffect(() => {
    if (open) { setAmount(''); setAction('deposit') }
  }, [open, goal])

  if (!goal) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    if (action === 'deposit') onDeposit(goal.id, Number(amount))
    else onWithdraw(goal.id, Number(amount))
  }

  return (
    <Modal open={open} onClose={onClose} title={`Nạp / Rút - ${goal.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">Hiện tại</p>
          <p className="text-2xl font-bold" style={{ color: goal.color }}>
            {formatCurrency(goal.current_amount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Mục tiêu: {formatCurrency(goal.target_amount)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hành động</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAction('deposit')} className={`py-2.5 rounded-lg border-2 font-medium ${action === 'deposit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
              <Plus size={14} className="inline mr-1" /> Nạp thêm
            </button>
            <button type="button" onClick={() => setAction('withdraw')} className={`py-2.5 rounded-lg border-2 font-medium ${action === 'withdraw' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'}`}>
              <Minus size={14} className="inline mr-1" /> Rút ra
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền (₫) <span className="text-red-500">*</span></label>
          <input type="number" required min="0" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" className="btn-primary">Xác nhận</button>
        </div>
      </form>
    </Modal>
  )
}