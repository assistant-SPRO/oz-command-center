import { useState, useEffect } from 'react'

const PAGES = ['overview', 'projects', 'claude', 'infrastructure']

export function useRouter() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '') || 'overview'
    return PAGES.includes(hash) ? hash : 'overview'
  })

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || 'overview'
      setPage(PAGES.includes(hash) ? hash : 'overview')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (p) => {
    window.location.hash = p
  }

  return { page, navigate, PAGES }
}
