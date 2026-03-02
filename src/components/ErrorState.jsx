import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <AlertCircle size={24} className="text-red-400 mb-2" />
      <p className="text-sm text-red-500 dark:text-red-400 mb-2">
        {message || 'Failed to load data'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}
