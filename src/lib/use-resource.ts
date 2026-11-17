"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { api, errorMessage } from "./client"

/**
 * Fetch JSON from one of the app's API routes, optionally re-fetching every
 * `intervalMs` (live dashboards). `data` is null while the current URL loads,
 * so changing a filter shows a loading state instead of stale results.
 */
export function useResource<T>(url: string, intervalMs?: number) {
  const [state, setState] = useState<{ url: string; data: T } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = () =>
      api<T>(url)
        .then((data) => !cancelled && setState({ url, data }))
        .catch((err) => !cancelled && toast.error(errorMessage(err)))

    run()
    const id = intervalMs ? setInterval(run, intervalMs) : undefined
    return () => {
      cancelled = true
      if (id) clearInterval(id)
    }
  }, [url, intervalMs, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const data = state?.url === url ? state.data : null
  const mutate = useCallback((update: (prev: T) => T) => setState((s) => (s ? { ...s, data: update(s.data) } : s)), [])

  return { data, reload, mutate }
}
