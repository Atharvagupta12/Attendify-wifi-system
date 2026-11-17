"use client"

/** Error thrown by `api()` with the server's message. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/**
 * Small fetch wrapper for the app's own API: JSON in/out, cookie auth,
 * server error messages surfaced, and a redirect to /login when the session expired.
 */
export async function api<T = unknown>(url: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && !url.startsWith("/api/auth/")) {
      window.location.href = "/login"
    }
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  }
  return data as T
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
