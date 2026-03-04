import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { supabase, isConfigured } from '../lib/supabase'
import { X, Filter, ArrowUpDown, Plus, Calendar, Building2, User, Tag } from 'lucide-react'

const priorityColors = {
  urgent: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-300 dark:border-red-700' },
  high: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-300 dark:border-orange-700' },
  normal: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-300 dark:border-blue-700' },
  low: { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-300 dark:border-gray-600' },
}

const businessLabels = {
  dcv: { label: 'DCV', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  spai: { label: 'SPAI', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  nmm: { label: 'NMM', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  'babineau-media': { label: 'Bab Media', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  'rhythm-video': { label: 'Rhythm', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
}

const categoryLabels = {
  work: { label: 'Work', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  personal: { label: 'Personal', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  errand: { label: 'Errand', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  meeting_action: { label: 'Meeting', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
}

const columns = [
  { key: 'todo', label: 'To Do', headerBg: 'bg-gray-50 dark:bg-gray-700/50', count_bg: 'bg-gray-200 dark:bg-gray-600' },
  { key: 'in_progress', label: 'In Progress', headerBg: 'bg-blue-50 dark:bg-blue-900/20', count_bg: 'bg-blue-200 dark:bg-blue-800' },
  { key: 'done', label: 'Done', headerBg: 'bg-green-50 dark:bg-green-900/20', count_bg: 'bg-green-200 dark:bg-green-800' },
]

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function formatDueDate(ts) {
  if (!ts) return null
  const due = new Date(ts)
  const now = new Date()
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, className: 'text-red-600 dark:text-red-400 font-medium' }
  if (diffDays === 0) return { text: 'Due today', className: 'text-orange-600 dark:text-orange-400 font-medium' }
  if (diffDays === 1) return { text: 'Due tomorrow', className: 'text-yellow-600 dark:text-yellow-400' }
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, className: 'text-gray-600 dark:text-gray-400' }
  return { text: formatDate(ts), className: 'text-gray-500 dark:text-gray-400' }
}

function TaskCard({ task, onClick }) {
  const priority = priorityColors[task.priority] || priorityColors.normal
  const biz = task.business_key && businessLabels[task.business_key]
  const cat = task.category && categoryLabels[task.category]
  const dueInfo = task.status !== 'done' ? formatDueDate(task.due_date) : null

  return (
    <button
      onClick={() => onClick(task)}
      className={`w-full text-left bg-white dark:bg-gray-800 border ${priority.border} rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer group`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {task.title}
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${priority.bg} ${priority.text}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1.5">
          {task.description}
        </p>
      )}
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        {biz && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${biz.color}`}>
            {biz.label}
          </span>
        )}
        {cat && cat.label !== 'Work' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cat.color}`}>
            {cat.label}
          </span>
        )}
        {task.assignee && task.assignee !== 'Craig' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {task.assignee}
          </span>
        )}
        {task.source === 'meeting' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
            from meeting
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {dueInfo ? (
          <span className={`text-[10px] ${dueInfo.className}`}>
            {dueInfo.text}
          </span>
        ) : (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatDate(task.created_at)}
          </span>
        )}
        {task.calendar_event_id && (
          <Calendar size={10} className="text-blue-400" />
        )}
      </div>
    </button>
  )
}

function CreateTaskModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [status, setStatus] = useState('todo')
  const [businessKey, setBusinessKey] = useState('')
  const [assignee, setAssignee] = useState('Craig')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('work')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    try {
      const task = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        business_key: businessKey || null,
        assignee: assignee.trim() || 'Craig',
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category,
        source: 'dashboard',
        created_by: 'dashboard',
      }
      const { error: insertError } = await supabase.from('tasks').insert(task)
      if (insertError) throw insertError
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectClass = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Task</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className={inputClass}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Business</label>
                <select value={businessKey} onChange={e => setBusinessKey(e.target.value)} className={selectClass}>
                  <option value="">Personal</option>
                  <option value="dcv">Denver Conference Video</option>
                  <option value="spai">Streamline Pro AI</option>
                  <option value="nmm">Ninja Music Marketing</option>
                  <option value="babineau-media">Babineau Media</option>
                  <option value="rhythm-video">Rhythm Video</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Assignee</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="Craig"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="errand">Errand</option>
                  <option value="meeting_action">Meeting Action</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={selectClass}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, onClose }) {
  if (!task) return null

  const priority = priorityColors[task.priority] || priorityColors.normal
  const biz = task.business_key && businessLabels[task.business_key]
  const cat = task.category && categoryLabels[task.category]
  const [status, setStatus] = useState(task.status)
  const [taskPriority, setTaskPriority] = useState(task.priority)
  const [taskAssignee, setTaskAssignee] = useState(task.assignee || 'Craig')
  const [taskBusiness, setTaskBusiness] = useState(task.business_key || '')
  const [taskCategory, setTaskCategory] = useState(task.category || 'work')
  const [taskDueDate, setTaskDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const update = {
        status,
        priority: taskPriority,
        assignee: taskAssignee.trim() || 'Craig',
        business_key: taskBusiness || null,
        category: taskCategory,
        due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      }
      if (status === 'done' && task.status !== 'done') {
        update.completed_at = new Date().toISOString()
      }
      if (status !== 'done' && task.status === 'done') {
        update.completed_at = null
      }
      const { error: updateError } = await supabase
        .from('tasks')
        .update(update)
        .eq('id', task.id)
      if (updateError) throw updateError
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectClass = "w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
  const inputClass = "w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                  {task.priority}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {task.status.replace('_', ' ')}
                </span>
                {biz && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${biz.color}`}>
                    {biz.label}
                  </span>
                )}
                {cat && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cat.color}`}>
                    {cat.label}
                  </span>
                )}
                {task.source === 'meeting' && (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                    from meeting
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
            {task.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No description provided.</p>
            )}
          </div>

          {/* Editable fields */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Priority</label>
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className={selectClass}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Business</label>
                <select value={taskBusiness} onChange={e => setTaskBusiness(e.target.value)} className={selectClass}>
                  <option value="">Personal</option>
                  <option value="dcv">DCV</option>
                  <option value="spai">Streamline Pro AI</option>
                  <option value="nmm">Ninja Music</option>
                  <option value="babineau-media">Babineau Media</option>
                  <option value="rhythm-video">Rhythm Video</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Assignee</label>
                <input
                  type="text"
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)} className={selectClass}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="errand">Errand</option>
                  <option value="meeting_action">Meeting Action</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2 mt-2">
                {error}
              </div>
            )}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <p className="text-gray-900 dark:text-white font-medium">{formatTime(task.created_at)}</p>
            </div>
            {task.completed_at && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Completed</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatTime(task.completed_at)}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created by</span>
              <p className="text-gray-900 dark:text-white font-medium">{task.created_by || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Last updated</span>
              <p className="text-gray-900 dark:text-white font-medium">{formatTime(task.updated_at)}</p>
            </div>
            {task.due_date && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Due date</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatTime(task.due_date)}</p>
              </div>
            )}
            {task.source && task.source !== 'manual' && task.source !== 'dashboard' && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Source</span>
                <p className="text-gray-900 dark:text-white font-medium">{task.source}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const { data: tasks, loading } = useRealtimeTable('tasks', {
    orderBy: 'created_at',
    ascending: false,
    limit: 200
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [businessFilter, setBusinessFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique assignees from data
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))]

  const filteredTasks = tasks
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
    .filter(t => {
      if (businessFilter === 'all') return true
      if (businessFilter === 'personal') return !t.business_key
      return t.business_key === businessFilter
    })
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .filter(t => assigneeFilter === 'all' || t.assignee === assigneeFilter)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 }
        return (order[a.priority] || 2) - (order[b.priority] || 2)
      }
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const activeFilterCount = [priorityFilter, businessFilter, categoryFilter, assigneeFilter]
    .filter(f => f !== 'all').length

  if (!isConfigured()) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Connect Supabase to manage projects.
      </div>
    )
  }

  const filterSelectClass = "text-sm bg-transparent text-gray-700 dark:text-gray-300 border-none outline-none cursor-pointer"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Board</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Plus size={14} />
            New Task
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 shadow-sm border text-sm ${
              activeFilterCount > 0
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSortBy(s => {
              if (s === 'created_at') return 'priority'
              if (s === 'priority') return 'due_date'
              return 'created_at'
            })}
            className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <ArrowUpDown size={14} />
            {sortBy === 'priority' ? 'Priority' : sortBy === 'due_date' ? 'Due Date' : 'Date'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-gray-400" />
            <select value={businessFilter} onChange={e => setBusinessFilter(e.target.value)} className={filterSelectClass}>
              <option value="all">All Businesses</option>
              <option value="personal">Personal</option>
              <option value="dcv">DCV</option>
              <option value="spai">Streamline Pro AI</option>
              <option value="nmm">Ninja Music</option>
              <option value="babineau-media">Babineau Media</option>
              <option value="rhythm-video">Rhythm Video</option>
            </select>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1.5">
            <User size={14} className="text-gray-400" />
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className={filterSelectClass}>
              <option value="all">All People</option>
              {assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1.5">
            <Tag size={14} className="text-gray-400" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={filterSelectClass}>
              <option value="all">All Categories</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="errand">Errand</option>
              <option value="meeting_action">Meeting Action</option>
            </select>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400" />
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={filterSelectClass}>
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={() => {
                  setPriorityFilter('all')
                  setBusinessFilter('all')
                  setCategoryFilter('all')
                  setAssigneeFilter('all')
                }}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}

      {/* Task Count Summary */}
      <div className="flex gap-4 text-sm">
        {columns.map(col => {
          const count = filteredTasks.filter(t => t.status === col.key).length
          return (
            <span key={col.key} className="text-gray-500 dark:text-gray-400">
              {col.label}: <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
            </span>
          )
        })}
        <span className="text-gray-400 dark:text-gray-500 ml-auto text-xs">
          {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key)
            return (
              <div key={col.key} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className={`${col.headerBg} rounded-lg px-3 py-2 mb-3 flex items-center justify-between`}>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {col.label}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.count_bg} text-gray-700 dark:text-gray-200`}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px] max-h-[calc(100vh-380px)] overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
