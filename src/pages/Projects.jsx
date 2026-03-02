import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { supabase, isConfigured } from '../lib/supabase'
import { X, Filter, ArrowUpDown, Plus } from 'lucide-react'

const priorityColors = {
  urgent: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-300 dark:border-red-700' },
  high: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-300 dark:border-orange-700' },
  normal: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-300 dark:border-blue-700' },
  low: { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-300 dark:border-gray-600' },
}

const columns = [
  { key: 'todo', label: 'To Do', emoji: '', headerBg: 'bg-gray-50 dark:bg-gray-700/50', count_bg: 'bg-gray-200 dark:bg-gray-600' },
  { key: 'in_progress', label: 'In Progress', emoji: '', headerBg: 'bg-blue-50 dark:bg-blue-900/20', count_bg: 'bg-blue-200 dark:bg-blue-800' },
  { key: 'done', label: 'Done', emoji: '', headerBg: 'bg-green-50 dark:bg-green-900/20', count_bg: 'bg-green-200 dark:bg-green-800' },
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

function TaskCard({ task, onClick }) {
  const priority = priorityColors[task.priority] || priorityColors.normal

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
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {formatDate(task.created_at)}
        </span>
        {task.created_by && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {task.created_by}
          </span>
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        created_by: 'dashboard',
      })
      if (insertError) throw insertError
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
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
  const [status, setStatus] = useState(task.status)
  const [taskPriority, setTaskPriority] = useState(task.priority)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (status === task.status && taskPriority === task.priority) {
      onClose()
      return
    }
    setSaving(true)
    setError(null)

    try {
      const update = {
        status,
        priority: taskPriority,
        updated_at: new Date().toISOString(),
      }
      if (status === 'done' && task.status !== 'done') {
        update.completed_at = new Date().toISOString()
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                  {task.priority}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {task.status.replace('_', ' ')}
                </span>
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
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
  const [sortBy, setSortBy] = useState('created_at')

  const filteredTasks = tasks
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 }
        return (order[a.priority] || 2) - (order[b.priority] || 2)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

  if (!isConfigured()) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Connect Supabase to manage projects.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Board</h1>
        <div className="flex items-center gap-2">
          {/* New Task Button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Plus size={14} />
            New Task
          </button>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <Filter size={14} className="text-gray-400" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-sm bg-transparent text-gray-700 dark:text-gray-300 border-none outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortBy(s => s === 'created_at' ? 'priority' : 'created_at')}
            className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <ArrowUpDown size={14} />
            {sortBy === 'priority' ? 'By Priority' : 'By Date'}
          </button>
        </div>
      </div>

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
                    {col.emoji} {col.label}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.count_bg} text-gray-700 dark:text-gray-200`}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
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
