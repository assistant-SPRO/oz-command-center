import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
