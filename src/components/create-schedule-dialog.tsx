"use client"

import { useEffect, useState, type SyntheticEvent } from "react"
import toast from "react-hot-toast"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, selectClass } from "@/components/common"
import { api, errorMessage } from "@/lib/client"

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
const INITIAL = { className: "", section: "", subjectName: "", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00" }

export default function CreateScheduleDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const set = (key: keyof typeof INITIAL) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time")
      return
    }
    setSaving(true)
    try {
      await api("/api/teacher/schedules", { method: "POST", body: form })
      toast.success(`${form.subjectName} scheduled`)
      setForm(INITIAL)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-schedule-title">
      <div className="absolute inset-0 animate-in bg-black/50 backdrop-blur-sm fade-in" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-md animate-in rounded-2xl border bg-card p-6 shadow-float duration-200 fade-in zoom-in-95">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="create-schedule-title" className="text-lg font-semibold">
              Add a weekly lecture
            </h2>
            <p className="text-sm text-muted-foreground">Repeats every week. New classes are created automatically.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Subject">
            <Input required autoFocus value={form.subjectName} onChange={set("subjectName")} placeholder="Mathematics" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <Input required value={form.className} onChange={set("className")} placeholder="10" />
            </Field>
            <Field label="Section">
              <Input required value={form.section} onChange={set("section")} placeholder="A" />
            </Field>
          </div>
          <Field label="Day">
            <select value={form.dayOfWeek} onChange={set("dayOfWeek")} className={selectClass}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input required type="time" value={form.startTime} onChange={set("startTime")} />
            </Field>
            <Field label="Ends">
              <Input required type="time" value={form.endTime} onChange={set("endTime")} />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Add lecture
          </Button>
        </div>
      </form>
    </div>
  )
}
