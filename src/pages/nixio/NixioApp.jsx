import { useEffect, useState } from 'react'
import { useNixioStore } from '../../stores/nixioStore'
import Modal from '../../components/common/Modal'
import { Plus, Search, Edit2, Trash2, CheckSquare, Calendar, Flag, MoreVertical } from 'lucide-react'
import { formatDateFull, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/Spinner'

const COLUMNS = [
  { id: 'todo', title: 'Cần làm', accent: 'border-slate-400' },
  { id: 'in_progress', title: 'Đang làm', accent: 'border-blue-400' },
  { id: 'done', title: 'Hoàn thành', accent: 'border-emerald-400' },
]

export default function NixioApp() {
  const { tasks, loading, fetchTasks, addTask, updateTask, deleteTask, getTaskStats } = useNixioStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const stats = getTaskStats()

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search && !`${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSubmit = async (data) => {
    if (editing) {
      await updateTask(editing.id, data)
    } else {
      await addTask(data)
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDrop = async (status, e) => {
    e.preventDefault()
    const id = draggedId || e.dataTransfer.getData('text/plain')
    if (id) {
      await updateTask(id, { status })
    }
    setDraggedId(null)
  }

  const handleDelete = async () => {
    if (confirmId) {
      await deleteTask(confirmId)
      setConfirmId(null)
    }
  }

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'todo', label: 'Cần làm', count: stats.todo },
    { id: 'in_progress', label: 'Đang làm', count: stats.inProgress },
    { id: 'done', label: 'Hoàn thành', count: stats.done },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nixio</h1>
          <p className="text-sm text-slate-500">Quản lý công việc với Kanban Board</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Thêm task
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label} <span className="opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="Chưa có task nào"
            description="Tạo task mới để bắt đầu quản lý công việc của bạn"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.id)
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(col.id, e)}
                className={`bg-slate-100/60 rounded-xl p-3 min-h-[300px] border-t-4 ${col.accent}`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    {col.title}
                    <span className="ml-2 text-slate-400">({colTasks.length})</span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => {
                        setEditing(task)
                        setModalOpen(true)
                      }}
                      onDelete={() => setConfirmId(task.id)}
                      onDragStart={(e) => {
                        setDraggedId(task.id)
                        e.dataTransfer.setData('text/plain', task.id)
                      }}
                      onDragEnd={() => setDraggedId(null)}
                      isDragging={draggedId === task.id}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-lg">
                      Kéo thả task vào đây
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <TaskModal
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
        title="Xóa task?"
        message="Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const priorityColor = PRIORITY_COLORS[task.priority]
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColor.dot}`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 text-sm leading-snug">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${priorityColor.bg} ${priorityColor.text}`}>
              <Flag size={10} />
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.due_date && (
              <span className={`badge ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                <Calendar size={10} />
                {formatDateFull(task.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreVertical size={14} className="text-slate-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit()
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 size={12} /> Sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Xóa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskModal({ open, onClose, onSubmit, editing }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description || '')
      setStatus(editing.status)
      setPriority(editing.priority)
      setDueDate(editing.due_date || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setDueDate('')
    }
  }, [editing, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa task' : 'Thêm task mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="VD: Hoàn thành báo cáo tháng"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
            placeholder="Chi tiết về task..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Độ ưu tiên</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày hết hạn</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
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