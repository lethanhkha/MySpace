import { useEffect, useState } from 'react'
import { useNoteraStore } from '../../stores/noteraStore'
import { Plus, Search, Trash2, Pin, PinOff, StickyNote, X, PlusCircle, Tag as TagIcon } from 'lucide-react'
import { formatDateTime, NOTE_COLORS, truncate, stripHtml } from '../../lib/helpers'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/Spinner'

export default function NoteraApp() {
  const { notes, selectedNoteId, loading, fetchNotes, addNote, updateNote, deleteNote, togglePin, selectNote, getSelectedNote } =
    useNoteraStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  const selectedNote = getSelectedNote()
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))]

  const filtered = notes.filter((n) => {
    if (filter === 'pinned' && !n.is_pinned) return false
    if (filter !== 'all' && filter !== 'pinned' && !(n.tags || []).includes(filter)) return false
    if (search) {
      const text = `${n.title} ${stripHtml(n.content)}`.toLowerCase()
      if (!text.includes(search.toLowerCase())) return false
    }
    return true
  })

  const handleAddNote = async () => {
    await addNote()
  }

  const handleDelete = async () => {
    if (confirmId) {
      await deleteNote(confirmId)
      setConfirmId(null)
    }
  }

  const handleUpdateTitle = async (title) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { title })
    }
  }

  const handleUpdateContent = async (content) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { content })
    }
  }

  const handleSetColor = async (color) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { color })
    }
  }

  const handleAddTag = async () => {
    if (!selectedNote || !tagInput.trim()) return
    const tag = tagInput.trim().toLowerCase()
    if (selectedNote.tags?.includes(tag)) {
      setTagInput('')
      return
    }
    await updateNote(selectedNote.id, {
      tags: [...(selectedNote.tags || []), tag],
    })
    setTagInput('')
  }

  const handleRemoveTag = async (tag) => {
    if (!selectedNote) return
    await updateNote(selectedNote.id, {
      tags: (selectedNote.tags || []).filter((t) => t !== tag),
    })
  }

  const filterTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pinned', label: 'Đã ghim' },
    ...allTags.map((t) => ({ id: t, label: `#${t}` })),
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notera</h1>
          <p className="text-sm text-slate-500">Ghi chú cá nhân của bạn</p>
        </div>
        <button onClick={handleAddNote} className="btn-primary">
          <Plus size={18} />
          Ghi chú mới
        </button>
      </div>

      {/* Search + Filter */}
      <div className="card p-3 space-y-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Layout */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Đang tải...</div>
      ) : notes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={StickyNote}
            title="Chưa có ghi chú nào"
            description="Bắt đầu tạo ghi chú đầu tiên của bạn"
            action={
              <button onClick={handleAddNote} className="btn-primary">
                <Plus size={18} />
                Tạo ghi chú
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
          {/* Notes List */}
          <div className="lg:col-span-1 card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                {filtered.length} ghi chú
              </p>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">Không tìm thấy ghi chú</div>
              ) : (
                filtered.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    selected={note.id === selectedNoteId}
                    onSelect={() => selectNote(note.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <div className="card overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
                {/* Editor toolbar */}
                <div className="border-b border-slate-100 p-3 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => togglePin(selectedNote.id)}
                    className={`p-1.5 rounded hover:bg-slate-100 ${
                      selectedNote.is_pinned ? 'text-amber-500' : 'text-slate-400'
                    }`}
                    title={selectedNote.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                  >
                    {selectedNote.is_pinned ? <Pin size={16} /> : <PinOff size={16} />}
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleSetColor(c.bg)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          selectedNote.color === c.bg
                            ? 'border-slate-700 scale-110'
                            : 'border-slate-200 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.bg }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setConfirmId(selectedNote.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 ml-auto"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Title */}
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  placeholder="Tiêu đề ghi chú"
                  className="w-full px-6 pt-4 pb-2 text-xl font-semibold bg-transparent border-none focus:outline-none placeholder:text-slate-300"
                />

                {/* Tags */}
                <div className="px-6 pb-2 flex items-center gap-1.5 flex-wrap">
                  {(selectedNote.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="badge bg-slate-100 text-slate-600 hover:bg-slate-200 group cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <TagIcon size={10} />
                      {tag}
                      <X size={10} className="opacity-0 group-hover:opacity-100" />
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="+ thêm tag"
                      className="w-24 px-2 py-0.5 text-xs bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Content */}
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => handleUpdateContent(e.target.value)}
                  placeholder="Bắt đầu viết ghi chú của bạn..."
                  className="flex-1 px-6 py-3 bg-transparent border-none focus:outline-none resize-none text-slate-700 leading-relaxed placeholder:text-slate-300"
                  style={{ minHeight: '300px' }}
                />

                {/* Footer */}
                <div className="px-6 py-2 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                  <span>Cập nhật: {formatDateTime(selectedNote.updated_at)}</span>
                  <span>Tạo: {formatDateTime(selectedNote.created_at)}</span>
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <StickyNote size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Chọn một ghi chú để xem</p>
                </div>
              </div>
            )}
          </div>
        </div>
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

function NoteListItem({ note, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        selected ? 'bg-amber-50/60 border-l-4 border-l-amber-400' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-3 h-3 rounded-full mt-1 flex-shrink-0 border"
          style={{ backgroundColor: note.color, borderColor: 'rgba(0,0,0,0.1)' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {note.is_pinned && <Pin size={10} className="text-amber-500 flex-shrink-0" />}
            <h4 className="font-medium text-sm text-slate-900 truncate">
              {note.title || 'Không có tiêu đề'}
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {truncate(stripHtml(note.content), 80) || 'Chưa có nội dung'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{formatDateTime(note.updated_at)}</p>
        </div>
      </div>
    </button>
  )
}