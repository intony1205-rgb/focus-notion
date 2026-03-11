'use client'
import { useState, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasksStore } from '@/store/tasksStore'
import { useTimerStore } from '@/store/timerStore'
import { createBrowserClient } from '@/lib/supabase'
import type { Task, TaskPriority } from '@/types/database'

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-blue-400' },
  medium: { label: 'Med',    color: 'text-yellow-400' },
  high:   { label: 'High',   color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' },
}
const TASK_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#06b6d4']

function TaskRow({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const { setActiveTask, activeTask } = useTimerStore()
  const isActive = activeTask?.id === task.id
  const pct = task.estimated_pomodoros > 0 ? (task.completed_pomodoros / task.estimated_pomodoros) * 100 : 0

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${isActive ? 'bg-zinc-700 border-zinc-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
      <button {...attributes} {...listeners} className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0">
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/><circle cx="4" cy="8" r="1.5"/>
          <circle cx="8" cy="8" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
        </svg>
      </button>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: task.color }} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight truncate ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{task.title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-zinc-500 flex-shrink-0">{task.completed_pomodoros}/{task.estimated_pomodoros}🍅</span>
        </div>
      </div>
      <span className={`text-xs font-medium flex-shrink-0 ${PRIORITY_META[task.priority].color}`}>{PRIORITY_META[task.priority].label}</span>
      <button onClick={() => setActiveTask(isActive ? null : task)}
        className={`flex-shrink-0 p-1 rounded transition-all ${isActive ? 'text-red-400 hover:text-red-300' : 'text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100'}`}>🎯</button>
      <button onClick={() => onDelete(task.id)} className="flex-shrink-0 p-1 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
    </div>
  )
}

function AddTaskForm({ onAdd }: { onAdd: (t: Task) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [pomodoros, setPomodoros] = useState(2)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [color, setColor] = useState(TASK_COLORS[0])
  const [saving, setSaving] = useState(false)
  const supabase = createBrowserClient()

  const handleSubmit = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('tasks')
        .insert({ user_id: user.id, title: title.trim(), estimated_pomodoros: pomodoros, priority, color, status: 'backlog' })
        .select().single()
      if (!error && data) { onAdd(data); setTitle(''); setPomodoros(2); setPriority('medium'); setOpen(false) }
    } finally { setSaving(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-zinc-700 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition">
      <span className="text-lg leading-none">+</span> Add task
    </button>
  )

  return (
    <div className="flex flex-col gap-3 px-3 py-3 rounded-lg bg-zinc-800 border border-zinc-600">
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Task title…" className="bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none border-b border-zinc-600 pb-1 focus:border-zinc-400 transition" />
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>🍅</span>
          <input type="number" min={1} max={20} value={pomodoros} onChange={(e) => setPomodoros(Number(e.target.value))}
            className="w-10 bg-zinc-700 rounded px-1.5 py-0.5 text-zinc-100 text-xs outline-none" />
        </label>
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-0.5 outline-none">
          {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
        </select>
        <div className="flex gap-1">
          {TASK_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-offset-zinc-800 ring-white scale-110' : ''}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={!title.trim() || saving}
          className="px-4 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition">
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

export function TaskList() {
  const { tasks, addTask, removeTask, reorderTasks } = useTasksStore()
  const supabase = createBrowserClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    const newOrder = arrayMove(tasks, oldIndex, newIndex)
    const orderedIds = newOrder.map((t) => t.id)
    reorderTasks(orderedIds)
    Promise.all(orderedIds.map((id, i) => supabase.from('tasks').update({ position: i }).eq('id', id))).catch(console.error)
  }, [tasks, reorderTasks, supabase])

  const handleDelete = useCallback(async (id: string) => {
    removeTask(id)
    await supabase.from('tasks').delete().eq('id', id).catch(console.error)
  }, [removeTask, supabase])

  const backlog = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived')
  const done = tasks.filter((t) => t.status === 'completed')

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={backlog.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {backlog.map((task) => <TaskRow key={task.id} task={task} onDelete={handleDelete} />)}
        </SortableContext>
      </DndContext>
      <AddTaskForm onAdd={addTask} />
      {done.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-zinc-500 cursor-pointer select-none hover:text-zinc-400">Completed ({done.length})</summary>
          <div className="mt-1 flex flex-col gap-1">
            {done.map((task) => (
              <div key={task.id} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-zinc-500 line-through">
                <div className="w-2 h-2 rounded-full bg-zinc-600" />{task.title}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}