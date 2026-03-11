'use client'
import { useEffect, useState } from 'react'
import { useTasksStore } from '@/store/tasksStore'
import { TaskList } from '@/components/tasks/TaskList'
import { PomodoroTimer } from '@/components/timer/PomodoroTimer'
import { DayTimeline } from '@/components/calendar/DayTimeline'
import type { Task, CalendarEvent } from '@/types/database'

interface Props {
  initialTasks: Task[]
  initialEvents: CalendarEvent[]
}

export function DashboardShell({ initialTasks, initialEvents }: Props) {
  const { setTasks } = useTasksStore()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedDate] = useState(() => new Date())

  useEffect(() => {
    setTasks(initialTasks)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-zinc-100 font-sans">
      <aside className="w-72 flex-shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-4 border-b border-zinc-800">
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">Focus-Notion</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Backlog</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <TaskList />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 border-r border-zinc-800">
        <DayTimeline date={selectedDate} events={events} onEventsChange={setEvents} />
      </main>

      <aside className="w-80 flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">Pomodoro</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Stay in flow</p>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 pt-8 overflow-y-auto">
          <div className="w-full">
            <PomodoroTimer />
          </div>
        </div>
      </aside>
    </div>
  )
}