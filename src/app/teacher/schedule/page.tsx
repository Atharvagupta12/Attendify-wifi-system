"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { CalendarDays, Clock, Plus, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, PageHeader, Panel, Spinner } from "@/components/common"
import CreateScheduleDialog from "@/components/create-schedule-dialog"
import { api, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { formatTimeRange, titleCaseDay } from "@/lib/format"

type ScheduleItem = {
  scheduleId: string
  subject: string
  subjectCode: string
  class: string
  studentCount: number
  dayOfWeek: string
  startTime: string
  endTime: string
}

const WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]

export default function SchedulePage() {
  const { data, reload: load, mutate } = useResource<{ data: ScheduleItem[] }>("/api/teacher/schedules")
  const items = data?.data ?? null
  const [open, setOpen] = useState(false)

  const remove = async (item: ScheduleItem) => {
    if (!confirm(`Delete ${item.subject} (${item.class}) on ${titleCaseDay(item.dayOfWeek)}? Its attendance history will be removed too.`)) return
    try {
      await api(`/api/teacher/schedules/${item.scheduleId}`, { method: "DELETE" })
      mutate((prev) => ({ data: prev.data.filter((i) => i.scheduleId !== item.scheduleId) }))
      toast.success("Lecture deleted")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const days = WEEK.map((day) => ({ day, items: items?.filter((i) => i.dayOfWeek === day) ?? [] })).filter(
    (d) => d.items.length > 0,
  )

  return (
    <>
      <PageHeader
        title="Weekly schedule"
        description="Attendance opens automatically during each of these slots."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add lecture
          </Button>
        }
      />

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title="Your timetable is empty"
            description="Add your first weekly lecture. Students of that class will see it on their dashboard."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus /> Add lecture
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map(({ day, items }) => (
            <Panel key={day} title={titleCaseDay(day)}>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.scheduleId} className="group rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.subject}</p>
                        <p className="text-xs text-muted-foreground">{item.subjectCode}</p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${item.subject}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> {formatTimeRange(item.startTime, item.endTime)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" /> {item.class} · {item.studentCount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      <CreateScheduleDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </>
  )
}
