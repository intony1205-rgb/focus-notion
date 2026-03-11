'use client'
import { useState, useEffect } from 'react'
import { Plus, Circle, CheckCircle2, Trash2, X, Loader2, Play, Pause, Square } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTimer } from '../../lib/timerContext'

type Task = {
  id: string
  name: string
  estimated_pomodoros: number
  completed_pomodoros: number
  completed: boolean
}
type Project = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

const COLORS = ['#ff6b35', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c', '#34d399']

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const timer = useTimer()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data: pData, error: err } = await supabase.from('projects').select('*').order('created_at')
    if (err) { setError(err.message); setLoading(false); return }
    const all = await Promise.all((pData ?? []).map(async p => {
      const { data: tData } = await supabase.from('tasks').select('*').eq('project_id', p.id).order('created_at')
      return { ...p, tasks: tData ?? [] }
    }))
    setProjects(all)
    if (all.length > 0) setSelectedId(all[0].id)
    setLoading(false)
  }

  const addProject = async () => {
    if (!newProjectName.trim()) return
    const color = COLORS[projects.length % COLORS.length]
    const { data, error } = await supabase.from('projects').insert({ name: newProjectName.trim(), color }).select().single()
    if (error) { setError(error.message); return }
    setProjects(p => [...p, { ...data, tasks: [] }])
    setSelectedId(data.id)
    setNewProjectName('')
    setAddingProject(false)
  }

  const deleteProject = async (id: string) => {
    const proj = projects.find(p => p.id === id)
    if (proj?.tasks.some(t => t.id === timer.activeTaskId)) timer.stopTask()
    await supabase.from('projects').delete().eq('id', id)
    const rest = projects.filter(p => p.id !== id)
    setProjects(rest)
    setSelectedId(rest[0]?.id ?? '')
    setConfirmDelete(null)
  }

  const addTask = async () => {
    if (!newTaskName.trim() || !project) return
    const { data, error } = await supabase.from('tasks')
      .insert({ project_id: project.id, name: newTaskName.trim(), estimated_pomodoros: 1, completed_pomodoros: 0, completed: false })
      .select().single()
    if (error) { setError(error.message); return }
    setProjects(ps => ps.map(p => p.id === selectedId ? { ...p, tasks: [...p.tasks, data] } : p))
    setNewTaskName('')
    setAddingTask(false)
  }

  const toggleTask = async (taskId: string, current: boolean) => {
    await supabase.from('tasks').update({ completed: !current }).eq('id', taskId)
    setProjects(ps => ps.map(p => p.id === selectedId
      ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !current } : t) } : p))
  }

  const updatePomodoros = async (taskId: string, val: number) => {
    const v = Math.max(1, val)
    await supabase.from('tasks').update({ estimated_pomodoros: v }).eq('id', taskId)
    setProjects(ps => ps.map(p => p.id === selectedId
      ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, estimated_pomodoros: v } : t) } : p))
  }

  const deleteTask = async (taskId: string) => {
    if (timer.activeTaskId === taskId) timer.stopTask()
    await supabase.from('tasks').delete().eq('id', taskId)
    setProjects(ps => ps.map(p => p.id === selectedId
      ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p))
  }

  const handlePlay = (task: Task) => {
    if (timer.activeTaskId === task.id) timer.toggle()
    else timer.startTask(task.id, task.name)
  }

  const project = projects.find(p => p.id === selectedId)
  const done = project?.tasks.filter(t => t.completed).length ?? 0
  const total = project?.tasks.length ?? 0
  const pomDone = project?.tasks.reduce((a, t) => a + t.completed_pomodoros, 0) ?? 0
  const pomTotal = project?.tasks.reduce((a, t) => a + t.estimated_pomodoros, 0) ?? 0

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-full">
      <Loader2 size={22} className="text-accent animate-spin" />
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Project sidebar */}
      <div className="flex flex-col py-4 flex-shrink-0" style={{ width: 220, borderRight: '1px solid #1e1e22', background: '#0c0c0e' }}>
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#6b6b72' }}>Proyectos</span>
          <button onClick={() => setAddingProject(true)} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: '#6b6b72' }}>
            <Plus size={14} />
          </button>
        </div>

        {addingProject && (
          <div className="px-3 mb-2 flex gap-1">
            <input autoFocus value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') setAddingProject(false) }}
              placeholder="Nombre..."
              className="flex-1 px-2 py-1.5 rounded-lg text-sm font-mono outline-none"
              style={{ background: '#1e1e22', border: '1px solid #ff6b35', color: '#e8e8ea' }} />
            <button onClick={() => setAddingProject(false)} className="p-1 rounded hover:bg-white/10" style={{ color: '#6b6b72' }}>
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-0.5 px-2 flex-1 overflow-auto">
          {projects.map(p => {
            const sel = selectedId === p.id
            const tasksDone = p.tasks.filter(t => t.completed).length
            const hasActive = p.tasks.some(t => t.id === timer.activeTaskId)
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all group/proj"
                style={sel ? { background: p.color + '18', border: `1px solid ${p.color}35` } : { border: '1px solid transparent' }}>
                <div className="relative flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  {hasActive && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse border border-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: sel ? '#e8e8ea' : '#9898a0' }}>{p.name}</p>
                  <p className="text-xs font-mono" style={{ color: p.color + 'aa' }}>{tasksDone}/{p.tasks.length}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(p.id) }}
                  className="opacity-0 group-hover/proj:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                  style={{ color: '#6b6b72' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks */}
      {project ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #1e1e22' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
              <h1 className="font-display font-bold text-xl" style={{ color: '#e8e8ea' }}>{project.name}</h1>
            </div>
            <div className="flex gap-4 text-xs font-mono" style={{ color: '#6b6b72' }}>
              <span><CheckCircle2 size={12} className="inline mr-1" />{done}/{total}</span>
              <span>🍅 {pomDone}/{pomTotal}</span>
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-auto">
            {project.tasks.map(task => {
              const isActive = timer.activeTaskId === task.id
              const isRunning = isActive && timer.isRunning
              return (
                <div key={task.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-white/[0.025] transition-colors group/task"
                  style={{
                    borderBottom: '1px solid #161618',
                    background: isActive ? project.color + '0a' : undefined,
                  }}>

                  {/* Complete toggle */}
                  <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0"
                    style={{ color: task.completed ? project.color : '#3a3a3f' }}>
                    {task.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  </button>

                  {/* Play/Pause button — inline next to name */}
                  {!task.completed && (
                    <button onClick={() => handlePlay(task)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
                      style={isActive
                        ? { background: project.color, color: '#0e0e0f', boxShadow: `0 0 10px ${project.color}70` }
                        : { background: '#252528', color: '#6b6b72' }}>
                      {isRunning
                        ? <Pause size={9} />
                        : <Play size={9} style={{ marginLeft: '1px' }} />}
                    </button>
                  )}

                  {/* Task name */}
                  <span className="flex-1 text-sm font-mono truncate"
                    style={{ color: task.completed ? '#4a4a52' : '#e8e8ea', textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.name}
                  </span>

                  {/* Active label */}
                  {isActive && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: project.color + '22', color: project.color }}>
                      {isRunning ? '● en curso' : '⏸ pausado'}
                    </span>
                  )}

                  {/* Pomodoro dots */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(task.estimated_pomodoros, 10) }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-sm"
                          style={{ background: i < task.completed_pomodoros ? project.color : '#2a2a2e' }} />
                      ))}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                      <button onClick={() => updatePomodoros(task.id, task.estimated_pomodoros - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 text-sm font-mono"
                        style={{ color: '#6b6b72' }}>−</button>
                      <span className="text-xs font-mono w-4 text-center font-bold" style={{ color: '#ff6b35' }}>{task.estimated_pomodoros}</span>
                      <button onClick={() => updatePomodoros(task.id, task.estimated_pomodoros + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 text-sm font-mono"
                        style={{ color: '#6b6b72' }}>+</button>
                    </div>
                  </div>

                  {/* Stop / Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActive && (
                      <button onClick={timer.stopTask}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors"
                        style={{ color: '#6b6b72' }}>
                        <Square size={10} />
                      </button>
                    )}
                    <button onClick={() => deleteTask(task.id)}
                      className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/task:opacity-100 hover:bg-red-500/10 transition-all"
                      style={{ color: '#6b6b72' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add task row */}
            {addingTask ? (
              <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid #161618' }}>
                <Circle size={17} style={{ color: '#3a3a3f' }} className="flex-shrink-0" />
                <div className="w-6 flex-shrink-0" />
                <input autoFocus value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddingTask(false) }}
                  placeholder="Nombre de la tarea..."
                  className="flex-1 bg-transparent outline-none text-sm font-mono"
                  style={{ color: '#e8e8ea' }} />
              </div>
            ) : (
              <button onClick={() => setAddingTask(true)}
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/[0.025] transition-colors"
                style={{ color: '#4a4a52' }}>
                <Plus size={15} />
                <span className="text-sm font-mono">Añadir tarea</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-sm mb-4" style={{ color: '#4a4a52' }}>No hay proyectos todavía</p>
            <button onClick={() => setAddingProject(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all active:scale-95"
              style={{ background: '#ff6b35', color: '#0e0e0f' }}>
              <Plus size={14} /> Crear proyecto
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
          style={{ background: '#2a1010', border: '1px solid #ef4444', color: '#ef4444' }}>
          {error}
          <button onClick={() => setError('')}><X size={11} /></button>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmDelete(null)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: '#161618', border: '1px solid #2a2a2e' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-base mb-2" style={{ color: '#e8e8ea' }}>¿Eliminar proyecto?</h2>
            <p className="text-sm font-mono mb-5" style={{ color: '#6b6b72' }}>Se eliminarán también todas las tareas. No se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-display hover:bg-white/10 transition-all"
                style={{ color: '#9898a0' }}>Cancelar</button>
              <button onClick={() => deleteProject(confirmDelete)}
                className="px-4 py-2 rounded-xl text-sm font-display font-semibold"
                style={{ background: '#ef4444', color: 'white' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
