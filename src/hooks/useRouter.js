import { useState, useEffect } from 'react'

const PAGES = ['tasks', 'agents', 'calendar', 'projects', 'system', 'audit', 'memory', 'radar', 'pipeline']

export function useRouter(defaultPage = 'tasks') {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '') || defaultPage
    return PAGES.includes(hash) ? hash : defaultPage
  })

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || defaultPage
      setPage(PAGES.includes(hash) ? hash : defaultPage)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [defaultPage])

  const navigate = (p) => {
    window.location.hash = p
    setPage(p)
  }

  return { page, navigate, PAGES }
}
