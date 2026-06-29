import { useEffect, useState } from 'react'
import { useNoteraStore } from '../../stores/noteraStore'
import {
  Plus, Search, Trash2, Pin, PinOff, StickyNote, X, Palette, Archive, MoreVertical, Menu, Tag,
} from 'lucide-react'
import { formatDateFull, NOTE_COLORS, stripHtml } from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function NoteraApp() {
  const { notes, loading, fetchNotes, addNote, updateNote, deleteNote, togglePin } =
    useNoteraStore()

  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null) // null = editor đóng
  const [confirmId, setConfirmId] = useState(null)
  const [activeView, setActiveView] = useState('notes') // 'notes' | 'archive' | 'trash'

  useEffect(() => {
    fetchNotes()
  }, [])

  // Filter chính
  const filtered = notes.filter((n) => {
    if (activeView === 'archive' && !n.is_archived) return false
    if (activeView === 'notes' && n.is_archived) return false
    if (search) {
      const text = `${n.title} ${stripHtml(n.content)}`.toLowerCase()
      if (!text.includes(search.toLowerCase())) return false
    }
    return true
  })

  // Note ghim lên đầu
  const pinned = filtered.filter((n) => n.is_pinned)
  const others = filtered.filter((n) => !n.is_pinned)

  const handleAddNote = async () => {
    const result = await addNote({ color: NOTE_COLORS[0].bg })
    if (result?.success) {
      setEditingNote(result.data)
    }
  }

  const handleDelete = async () => {
    if (confirmId) {
      await deleteNote(confirmId)
      setConfirmId(null)
      if (editingNote?.id === confirmId) setEditingNote(null)
    }
  }

  const handleCardClick = (note) => {
    setEditingNote(note)
  }

  const counts = {
    notes: notes.filter((n) => !n.is_archived).length,
    archive: notes.filter((n) => n.is_archived).length,
    trash: 0,
  }

  return (
    <div className="space-y-4 -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 sticky top-16 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Menu size={20} />
          </button>
          <StickyNote size={20} className="text-amber-500" />
          <span className="font-semibold text-slate-700 hidden sm:block">Notera</span>
          <div className="flex-1 relative max-w-2xl mx-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-300 outline-none text-sm transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 hidden md:block">{filtered.length} ghi chú</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar (collapsible) */}
        {sidebarOpen && (
          <aside className="w-56 flex-shrink-0 border-r border-slate-200 bg-white px-2 py-4 sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto hidden md:block">
            <Sidebar
              counts={counts}
              activeView={activeView}
              onView={(v) => { setActiveView(v); setSearch('') }}
            />
          </aside>
        )}

        {/* Main grid */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 min-h-[calc(100vh-10rem)] bg-slate-50">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-7xl mb-4 opacity-30">📝</div>
              <h2 className="text-xl font-medium text-slate-700 mb-1">
                {search ? 'Không tìm thấy ghi chú' : activeView === 'archive' ? 'Chưa có ghi chú đã lưu trữ' : 'Ghi chú của bạn sẽ xuất hiện ở đây'}
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                {search ? 'Thử tìm với từ khóa khác' : 'Bắt đầu tạo ghi chú đầu tiên của bạn'}
              </p>
              {!search && activeView !== 'archive' && (
                <button onClick={handleAddNote} className="btn-primary">
                  <Plus size={16} /> Tạo ghi chú
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Pinned section */}
              {pinned.length > 0 && activeView === 'notes' && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                    Đã ghim
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {pinned.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onClick={() => handleCardClick(n)}
                        onPin={() => togglePin(n.id)}
                        onColorChange={(c) => updateNote(n.id, { color: c })}
                        onArchive={() => updateNote(n.id, { is_archived: !n.is_archived })}
                        onDelete={() => setConfirmId(n.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Others */}
              {others.length > 0 && (
                <div>
                  {pinned.length > 0 && activeView === 'notes' && (
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Khác
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {others.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onClick={() => handleCardClick(n)}
                        onPin={() => togglePin(n.id)}
                        onColorChange={(c) => updateNote(n.id, { color: c })}
                        onArchive={() => updateNote(n.id, { is_archived: !n.is_archived })}
                        onDelete={() => setConfirmId(n.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={handleAddNote}
        className="fixed bottom-8 right-8 w-14 h-14 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30"
        title="Tạo ghi chú mới"
      >
        <Plus size={28} />
      </button>

      {/* Editor Modal */}
      {editingNote && (
        <NoteEditorModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onUpdate={async (updates) => {
            await updateNote(editingNote.id, updates)
            // Cập nhật local để không phải fetch lại
            setEditingNote({ ...editingNote, ...updates })
          }}
          onPin={() => togglePin(editingNote.id)}
          onDelete={() => setConfirmId(editingNote.id)}
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Xóa ghi chú?"
        message="Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

function Sidebar({ counts, activeView, onView }) {
  const items = [
    { id: 'notes', label: 'Ghi chú', icon: StickyNote, count: counts.notes },
    { id: 'archive', label: 'Lưu trữ', icon: Archive, count: counts.archive },
  ]
  return (
    <div className="space-y-1">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <button
            key={it.id}
            onClick={() => onView(it.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeView === it.id
                ? 'bg-amber-100 text-amber-900 font-medium'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Icon size={18} className={activeView === it.id ? 'text-amber-600' : 'text-slate-500'} />
            <span className="flex-1 text-left">{it.label}</span>
            <span className="text-xs text-slate-400">{it.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function NoteCard({ note, onClick, onPin, onColorChange, onArchive, onDelete }) {
  const [showColors, setShowColors] = useState(false)
  const [showMore, setShowMore] = useState(false)

  return (
    <div
      onClick={onClick}
      className="group relative break-words rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      style={{ backgroundColor: note.color || '#fef3c7', minHeight: '72px' }}
    >
      <div className="p-3 pb-2">
        {/* Title */}
        {note.title && note.title !== 'Ghi chú mới' && (
          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1.5 line-clamp-3">
            {note.title}
          </h3>
        )}
        {/* Content */}
        <p className="text-slate-700 text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">
          {stripHtml(note.content) || '...'}
        </p>
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs px-1.5 py-0.5 bg-black/5 rounded">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions - show on hover */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          onClick={onPin}
          className="p-1.5 rounded-full hover:bg-black/10 text-slate-700"
          title={note.is_pinned ? 'Bỏ ghim' : 'Ghim'}
        >
          {note.is_pinned ? <Pin size={16} className="fill-current" /> : <PinOff size={16} />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowColors(!showColors)}
            className="p-1.5 rounded-full hover:bg-black/10 text-slate-700"
            title="Đổi màu"
          >
            <Palette size={16} />
          </button>
          {showColors && (
            <>
              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowColors(false) }} />
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-40 grid grid-cols-6 gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={(e) => { e.stopPropagation(); onColorChange(c.bg); setShowColors(false) }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      note.color === c.bg ? 'border-slate-700 scale-110' : 'border-white hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.bg }}
                    title={c.name}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={onArchive}
          className="p-1.5 rounded-full hover:bg-black/10 text-slate-700"
          title={note.is_archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
        >
          <Archive size={16} />
        </button>
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMore(!showMore)}
            className="p-1.5 rounded-full hover:bg-black/10 text-slate-700"
            title="Khác"
          >
            <MoreVertical size={16} />
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMore(false)} />
              <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40 w-36">
                <button
                  onClick={() => { navigator.clipboard.writeText(stripHtml(note.content)); setShowMore(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Sao chép nội dung
                </button>
                <button
                  onClick={() => { setShowMore(false); onDelete() }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-600"
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pinned indicator */}
      {note.is_pinned && (
        <div className="absolute top-1 right-1">
          <Pin size={12} className="text-amber-700 fill-amber-700" />
        </div>
      )}
    </div>
  )
}

function NoteEditorModal({ note, onClose, onUpdate, onPin, onDelete }) {
  const [title, setTitle] = useState(note.title || '')
  const [content, setContent] = useState(note.content || '')
  const [color, setColor] = useState(note.color || NOTE_COLORS[0].bg)
  const [tagInput, setTagInput] = useState('')
  const [showColors, setShowColors] = useState(false)

  // Đồng bộ khi note thay đổi (sau update thì note prop nhận data mới)
  useEffect(() => {
    setTitle(note.title || '')
    setContent(note.content || '')
    setColor(note.color || NOTE_COLORS[0].bg)
  }, [note.id])

  // Auto-save on change (debounce)
  useEffect(() => {
    const isDirty =
      title !== note.title ||
      content !== note.content ||
      color !== note.color
    if (!isDirty) return

    const timer = setTimeout(() => {
      onUpdate({ title, content, color })
    }, 600)
    return () => clearTimeout(timer)
  }, [title, content, color])

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    const tag = tagInput.trim().toLowerCase()
    if (note.tags?.includes(tag)) {
      setTagInput('')
      return
    }
    onUpdate({ tags: [...(note.tags || []), tag] })
    setTagInput('')
  }

  const handleRemoveTag = (tag) => {
    onUpdate({ tags: (note.tags || []).filter((t) => t !== tag) })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4">
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: color, maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-end px-3 py-2 border-b border-black/10">
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <span className="text-xs mr-3 hidden sm:inline">
              Đã chỉnh sửa: {formatDateFull(note.updated_at)}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowColors(!showColors)}
                className="p-1.5 rounded-full hover:bg-black/10"
                title="Đổi màu"
              >
                <Palette size={16} />
              </button>
              {showColors && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowColors(false) }} />
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 grid grid-cols-6 gap-1.5">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={(e) => { e.stopPropagation(); setColor(c.bg); setShowColors(false) }}
                        className={`w-7 h-7 rounded-full border-2 ${
                          color === c.bg ? 'border-slate-700 scale-110' : 'border-white'
                        }`}
                        style={{ backgroundColor: c.bg }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={onPin} className="p-1.5 rounded-full hover:bg-black/10" title="Ghim">
              {note.is_pinned ? <Pin size={16} className="fill-current" /> : <PinOff size={16} />}
            </button>
            <button
              onClick={() => onUpdate({ is_archived: !note.is_archived })}
              className="p-1.5 rounded-full hover:bg-black/10"
              title="Lưu trữ"
            >
              <Archive size={16} />
            </button>
            <button
              onClick={() => { onDelete(); onClose() }}
              className="p-1.5 rounded-full hover:bg-black/10"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10" title="Đóng">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề"
            className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none placeholder:text-slate-400 text-slate-900 mb-2"
          />

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {(note.tags || []).map((tag) => (
              <span
                key={tag}
                className="badge bg-black/10 text-slate-700 hover:bg-black/20 group cursor-pointer text-xs"
                onClick={() => handleRemoveTag(tag)}
              >
                <Tag size={10} />
                {tag}
                <X size={10} className="opacity-0 group-hover:opacity-100" />
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="+ thêm tag"
              className="text-xs bg-transparent border-b border-transparent hover:border-slate-400 focus:border-slate-700 focus:outline-none placeholder:text-slate-500 w-24 px-1"
            />
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bắt đầu viết ghi chú của bạn..."
            className="w-full bg-transparent border-none focus:outline-none resize-none text-slate-800 leading-relaxed placeholder:text-slate-500 text-base min-h-[300px]"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-black/10 text-xs text-slate-600 flex justify-between">
          <span>Tạo: {formatDateFull(note.created_at)}</span>
          <span>Tự động lưu</span>
        </div>
      </div>
    </div>
  )
}