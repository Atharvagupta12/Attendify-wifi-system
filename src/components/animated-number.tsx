"use client"

import { useEffect, useRef, useState } from "react"

/** Counts smoothly from the previous value to `value` (ease-out, ~700ms). */
export function AnimatedNumber({ value, suffix = "", duration = 700 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const initial = from.current
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(initial + (value - initial) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span className="tabular">
      {display}
      {suffix}
    </span>
  )
}
