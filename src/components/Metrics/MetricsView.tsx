'use client'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Period = 'today' | 'week' | 'month' | 'year'

export default function MetricsView() {
  const [period, setPeriod] = useState<Period>('week')
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('projects').select('*'),
    ])
    setTasks(t ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalPomodoros = tasks.reduce((a, t) => a + (t.completed_pomodoros ?? 0), 0)
  const estimatedPomodoros = tasks.reduce((a, t) => a + (t.estimated_pomodoros ?? 0), 0)
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={22} className="text-accent animate-spin" /></div>

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e22' }}>
        <h1 className="font-display font-bold text-xl" style={{ color: '#e8e8ea' }}>Métricas</h1>
      </div>
      <div className="p-6 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Tareas completadas', value: completedTasks, sub: `de ${totalTasks}`, color: '#ff6b35' },
            { label: 'Pomodoros realizados', value: totalPomodoros, sub: `de ${estimatedPomodoros} estimados`, color: '#4ade80' },
            { label: 'Tasa de completado', value: `${completionRate}%`, sub: 'de todas las tareas', color: '#60a5fa' },
            { label: 'Proyectos activos', value: projects.length, sub: 'en total', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: '#161618', border: '1px solid #2a2a2e' }}>
              <p className="text-3xl font-display font-black mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm font-mono" style={{ color: '#e8e8ea' }}>{s.label}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#6b6b72' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Per project */}
        {projects.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: '#161618', border: '1px solid #2a2a2e' }}>
            <h2 className="font-display font-semibold text-sm mb-4" style={{ color: '#e8e8ea' }}>Por proyecto</h2>
            <div className="flex flex-col gap-3">
              {projects.map(p => {
                const ptasks = tasks.filter(t => t.project_id === p.id)
                const pdone = ptasks.filter(t => t.completed).length
                const ppom = ptasks.reduce((a, t) => a + (t.completed_pomodoros ?? 0), 0)
                const rate = ptasks.length > 0 ? (pdone / ptasks.length) * 100 : 0
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-sm font-mono" style={{ color: '#e8e8ea' }}>{p.name}</span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: '#6b6b72' }}>{pdone}/{ptasks.length} · 🍅{ppom}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2e' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: p.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {totalTasks === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="font-mono text-sm" style={{ color: '#4a4a52' }}>Crea proyectos y tareas para ver tus métricas</p>
          </div>
        )}
      </div>
    </div>
  )
}
