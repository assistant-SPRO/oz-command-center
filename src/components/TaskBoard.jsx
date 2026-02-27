import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { LayoutGrid, X } from 'lucide-react'

const priorityColors = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  low: 'bg-gray-400 text-white',
}

const columns = [
  { key: 'todo', label: 'To Do', headerBg: 'bg-gray-100 dark:bg-gray-700' },
  { key: 'in_progress', label: 'In Progress', headerBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'done', label: 'Done', headerBg: 'bg-green-50 dark:bg-green-900/20' },
]

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TaskCard({ task, onClick }) {
  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
          {task.title}
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
        {formatTime(task.created_at)}
        {task.created_by && ` / ${task.created_by}`}
      </p>
    </button>
  )
}

function TaskModal({ task, onClose }) {
  if (!task) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Status: {task.status.replace('_', ' ')}
          </span>
        </div>
        {task.description ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No description provided.</p>
        )}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Created: {new Date(task.created_at).toLocaleString()}</p>
          {task.completed_at && <p>Completed: {new Date(task.completed_at).toLocaleString()}</p>}
          {task.created_by && <p>By: {task.created_by}</p>}
        </div>
      </div>
    </div>
  )
}

export default function TaskBoard() {
  const { data: tasks, loading } = useRealtimeTable('tasks', {
    orderBy: 'created_at',
    ascending: false,
    limit: 100
  })
  const [selectedTask, setSelectedTask] = useState(null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <LayoutGrid size={18} />
        Task Board
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see tasks.</p>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
            return (
              <div key={col.key} className="space-y-2">
                <div className={`${col.headerBg} rounded-lg px-3 py-1.5 flex items-center justify-between`}>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{col.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-600/60 px-1.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Empty</p>
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

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  )
}
