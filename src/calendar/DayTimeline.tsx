'use client'
import { useState, useCallback, useRef } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import { createBrowserClient } from '@/lib/supabase'
import { useTasksStore } from '@/store/tasksStore'
import type { CalendarEvent, Task } from '@/types/database'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 60

function formatHour(h: number) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function TimeSlot({ hour, children }: { hour: number; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` })
  return (
    <div ref={setNodeRef} className={`relative border-b border-zinc-800 transition-colors ${isOver ? 'bg-indigo-950/40' : ''}`} style={{ height: SLOT_HEIGHT }}>
      {children}
    </div>
  )
}

function EventBlock({ event, onDelete }: { event: CalendarEvent; onDelete: (id: string) => void }) {
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)
  const durationMins = (endDate.getTime() - startDate.getTime()) / 60000
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `event-${event.id}`, data: { type: 'event', event } })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`absolute left-1 right-1 rounded-md px-2 py-1 cursor-grab active:cursor-grabbing overflow-hidden ${isDragging ? 'opacity-40 z-10' : 'z-20'}`}
      style={{ top: ((startDate.getMinutes() / 60) * SLOT_HEIGHT), height: Math.max((durationMins / 60) * SLOT_HEIGHT, 20), background: event.color + 'cc', borderLeft: `3px solid ${event.color}` }}>
      <p className="text-xs font-semibold text-white truncate leading-tight">{event.title}</p>
      <p className="text-xs text-white/70">{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(event.id)}
        className="absolute top-0.5 right-0.5 text-white/60 hover:text-white text-xs leading-none">×</button>
    </div>
  )
}

export function DraggableTaskChip({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task-${task.id}`, data: { type: 'task', task } })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md cursor-grab active:cursor-grabbing text-xs font-medium text-white transition ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      style={{ background: task.color + 'bb' }}>
      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
      {task.title}
      <span className="ml-1 opacity-60">{task.estimated_pomodoros}🍅</span>
    </div>
  )
}

interface Props {
  date?: Date
  events: CalendarEvent[]
  onEventsChange: (events: CalendarEvent[]) => void
}

export function DayTimeline({ date = new Date(), events, onEventsChange }: Props) {
  const [activeDragData, setActiveDragData] = useState<any>(null)
  const { tasks } = useTasksStore()
  const supabase = createBrowserClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const eventsByHour: Record<number, CalendarEvent[]> = {}
  for (const ev of events) {
    const h = new Date(ev.start_time).getHours()
    if (!eventsByHour[h]) eventsByHour[h] = []
    eventsByHour[h].push(ev)
  }

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveDragData(null)
    const { over, active } = e
    if (!over) return
    const overHour = parseInt(String(over.id).replace('slot-', ''))
    const data = active.data.current as any
    const dateStr = date.toISOString().split('T')[0]

    if (data.type === 'task' && data.task) {
      const task = data.task
      const durationMins = task.estimated_pomodoros * 25
      const startTime = new Date(`${dateStr}T${String(overHour).padStart(2,'0')}:00:00`)
      const endTime = new Date(startTime.getTime() + durationMins * 60000)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: newEvent, error } = await supabase.from('calendar_events')
        .insert({ user_id: user.id, task_id: task.id, title: task.title, color: task.color, start_time: startTime.toISOString(), end_time: endTime.toISOString() })
        .select().single()
      if (!error && newEvent) onEventsChange([...events, newEvent])
    }

    if (data.type === 'event' && data.event) {
      const ev = data.event
      const durationMs = new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()
      const newStart = new Date(`${dateStr}T${String(overHour).padStart(2,'0')}:00:00`)
      const newEnd = new Date(newStart.getTime() + durationMs)
      const { error } = await supabase.from('calendar_events')
        .update({ start_time: newStart.toISOString(), end_time: newEnd.toISOString() }).eq('id', ev.id)
      if (!error) onEventsChange(events.map((x) => x.id === ev.id ? { ...x, start_time: newStart.toISOString(), end_time: newEnd.toISOString() } : x))
    }
  }, [date, events, onEventsChange, supabase])

  const handleDeleteEvent = useCallback(async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    onEventsChange(events.filter((e) => e.id !== id))
  }, [events, onEventsChange, supabase])

  const backlogTasks = tasks.filter((t) => t.status === 'backlog')

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveDragData(e.active.data.current)} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            <p className="text-xs text-zinc-500">Drag tasks onto the timeline</p>
          </div>
        </div>
        {backlogTasks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-zinc-800 min-h-[44px]">
            {backlogTasks.map((t) => <DraggableTaskChip key={t.id} task={t} />)}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="flex">
                <div className="w-14 flex-shrink-0 flex items-start justify-end pr-2 pt-1">
                  <span className="text-xs text-zinc-600 leading-none">{formatHour(hour)}</span>
                </div>
                <div className="flex-1 relative">
                  <TimeSlot hour={hour}>
                    {(eventsByHour[hour] ?? []).map((ev) => <EventBlock key={ev.id} event={ev} onDelete={handleDeleteEvent} />)}
                  </TimeSlot>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragData?.task && <div className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-xl cursor-grabbing" style={{ background: activeDragData.task.color }}>{activeDragData.task.title}</div>}
        {activeDragData?.event && <div className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-xl cursor-grabbing" style={{ background: activeDragData.event.color }}>{activeDragData.event.title}</div>}
      </DragOverlay>
    </DndContext>
  )
}