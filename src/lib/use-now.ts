"use client"

import { useEffect, useState } from "react"

/** Current time (ms), re-rendering every `intervalMs`. Keeps renders pure for countdowns and "x ago" labels. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
  return now
}
