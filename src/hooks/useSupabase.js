import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

// Hook for real-time subscription to a table
export function useRealtimeTable(table, options = {}) {
  const { orderBy = 'id', ascending = false, limit = 50, initialFetch = true } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    try {
      let query = supabase.from(table).select('*')
      if (orderBy) query = query.order(orderBy, { ascending })
      if (limit) query = query.limit(limit)

      const { data: result, error: fetchError } = await query
      if (fetchError) throw fetchError
      setData(result || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [table, orderBy, ascending, limit])

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    if (initialFetch) fetchData()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => {
            const updated = [payload.new, ...prev]
            return limit ? updated.slice(0, limit) : updated
          })
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(row =>
            row.id === payload.new.id ? payload.new : row
          ))
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(row => row.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, fetchData, initialFetch, limit])

  return { data, loading, error, refetch: fetchData }
}

// Hook for single-row table (like oz_status)
export function useRealtimeSingle(table) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .single()
        if (fetchError) throw fetchError
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const channel = supabase
      .channel(`realtime-${table}-single`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.new) setData(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])

  return { data, loading, error }
}

// Hook for latest grouped data (API health - latest per service)
export function useLatestPerGroup(table, groupField) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    try {
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .order('checked_at', { ascending: false })

      if (fetchError) throw fetchError

      // Get latest entry per group
      const latestMap = new Map()
      for (const row of result || []) {
        if (!latestMap.has(row[groupField])) {
          latestMap.set(row[groupField], row)
        }
      }
      setData(Array.from(latestMap.values()))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [table, groupField])

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    fetchData()

    const channel = supabase
      .channel(`realtime-${table}-grouped`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, fetchData])

  return { data, loading, error }
}
