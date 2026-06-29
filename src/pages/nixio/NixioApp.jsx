import { useEffect, useState } from 'react'
import { useNixioStore } from '../../stores/nixioStore'
import Modal from '../../components/common/Modal'
import { Plus, Search, Edit2, Trash2, CheckSquare, Calendar, Flag, MoreVertical, Folder, FolderPlus, Hash } from 'lucide-react'
import { formatDateFull, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/Spinner'

const COLUMNS = [
  { id: 'todo', title: 'Cần làm', accent: 'border-slate-400' },
  { id: 'in_progress', title: 'Đang làm', accent: 'border-blue-400' },
  { id: 'done', title: 'Hoàn thành', accent: 'border-emerald-400' },
]

const PROJECT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

export default function NixioApp() {
  const {
    tasks,
    projects,
    loading,
    fetchTasks,
    fetchProjects,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    getTaskStats,
    getProjectProgress,
  } = useNixioStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const [confirmType, setConfirmType] = useState('task') // 'task' | 'project'
  const [draggedId, setDraggedId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState('all') // 'all' | 'unassigned' | project_id
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [])

  const stats = getTaskStats()

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false
    if (selectedProjectId === 'all') {
      // show all
    } else if (selectedProjectId === 'unassigned') {
      if (t.project_id) return false
    } else if (t.project_id !== selectedProjectId) {
      return false
    }
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
      if (confirmType === 'task') {
        await deleteTask(confirmId)
      } else {
        await deleteProject(confirmId)
      }
      setConfirmId(null)
    }
  }

  const handleProjectSubmit = async (data) => {
    if (editingProject) {
      await updateProject(editingProject.id, data)
    } else {
      await addProject(data)
    }
    setProjectModalOpen(false)
    setEditingProject(null)
  }

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'todo', label: 'Cần làm', count: stats.todo },
    { id: 'in_progress', label: 'Đang làm', count: stats.inProgress },
    { id: 'done', label: 'Hoàn thành', count: stats.done },
  ]

  const unassignedCount = tasks.filter((t) => !t.project_id).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nixio</h1>
          <p className="text-sm text-slate-500">Quản lý công việc theo dự án</p>
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

      {/* Search */}
      <div className="card p-3 space-y-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar Projects */}
        <aside className="lg:col-span-1">
          <div className="card p-4 sticky top-32">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <Folder size={16} />
                Dự án
              </h3>
              <button
                onClick={() => {
                  setEditingProject(null)
                  setProjectModalOpen(true)
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
                title="Tạo dự án mới"
              >
                <FolderPlus size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedProjectId('all')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedProjectId === 'all'
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Hash size={14} />
                <span className="flex-1 text-left">Tất cả task</span>
                <span className="text-xs text-slate-400">{tasks.length}</span>
              </button>
              <button
                onClick={() => setSelectedProjectId('unassigned')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedProjectId === 'unassigned'
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Hash size={14} className="opacity-40" />
                <span className="flex-1 text-left">Chưa phân loại</span>
                <span className="text-xs text-slate-400">{unassignedCount}</span>
              </button>
            </div>

            <div className="mt-4 space-y-1">
              {projects.length === 0 && (
                <p className="text-xs text-slate-400 italic px-2 py-3">
                  Chưa có dự án nào. Tạo dự án để gom các task liên quan.
                </p>
              )}
              {projects.map((p) => {
                const progress = getProjectProgress(p.id)
                const active = selectedProjectId === p.id
                return (
                  <div
                    key={p.id}
                    className={`group rounded-lg transition-colors ${
                      active ? 'bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedProjectId(p.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span
                        className={`flex-1 text-left truncate ${
                          active ? 'text-primary-700 font-medium' : 'text-slate-700'
                        }`}
                      >
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {progress.total > 0 ? `${progress.percent}%` : '—'}
                      </span>
                    </button>
                    {progress.total > 0 && (
                      <div className="px-3 pb-2">
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${progress.percent}%`,
                              backgroundColor: p.color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {progress.done}/{progress.total} hoàn thành
                        </p>
                      </div>
                    )}
                    <div className="px-2 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProject(p)
                            setProjectModalOpen(true)
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700"
                          title="Sửa"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmType('project')
                            setConfirmId(p.id)
                          }}
                          className="p-1 hover:bg-red-100 rounded text-slate-500 hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Kanban Board */}
        <div className="lg:col-span-3">
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
                      {colTasks.map((task) => {
                        const proj = projects.find((p) => p.id === task.project_id)
                        return (
                          <TaskCard
                            key={task.id}
                            task={task}
                            project={proj}
                            onEdit={() => {
                              setEditing(task)
                              setModalOpen(true)
                            }}
                            onDelete={() => {
                              setConfirmType('task')
                              setConfirmId(task.id)
                            }}
                            onDragStart={(e) => {
                              setDraggedId(task.id)
                              e.dataTransfer.setData('text/plain', task.id)
                            }}
                            onDragEnd={() => setDraggedId(null)}
                            isDragging={draggedId === task.id}
                          />
                        )
                      })}
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
        </div>
      </div>

      {/* Modal task */}
      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
        editing={editing}
        projects={projects}
      />

      {/* Modal project */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false)
          setEditingProject(null)
        }}
        onSubmit={handleProjectSubmit}
        editing={editingProject}
      />

      <ConfirmDialog
        open={!!confirmId}
        title={confirmType === 'task' ? 'Xóa task?' : 'Xóa dự án?'}
        message={
          confirmType === 'task'
            ? 'Hành động này không thể hoàn tác.'
            : 'Tất cả task trong dự án sẽ trở thành chưa phân loại. Hành động này không thể hoàn tác.'
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

function TaskCard({ task, project, onEdit, onDelete, onDragStart, onDragEnd, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const priorityColor = PRIORITY_COLORS[task.priority]
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`task-card stagger-item bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        borderTopColor: project?.color || '#e2e8f0',
        borderTopWidth: project ? '3px' : '1px',
      }}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColor.dot}`} />
        <div className="flex-1 min-w-0">
          {project && (
            <div
              className="text-xs font-medium mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </div>
          )}
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

function TaskModal({ open, onClose, onSubmit, editing, projects }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description || '')
      setStatus(editing.status)
      setPriority(editing.priority)
      setDueDate(editing.due_date || '')
      setProjectId(editing.project_id || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setDueDate(new Date().toISOString().slice(0, 10))
      setProjectId('')
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
        project_id: projectId || null,
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Dự án</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input">
            <option value="">-- Chưa phân loại --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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

function ProjectModal({ open, onClose, onSubmit, editing }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setDescription(editing.description || '')
      setColor(editing.color || PROJECT_COLORS[0])
    } else {
      setName('')
      setDescription('')
      setColor(PROJECT_COLORS[0])
    }
  }, [editing, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ name, description, color })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa dự án' : 'Tạo dự án mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tên dự án <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="VD: Dự án Website, Học tập..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả</label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Màu</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}