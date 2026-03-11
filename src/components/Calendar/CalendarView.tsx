'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type CalEvent = { id: string; title: string; date: string; start_time: string | null; end_time: string | null; color: string }
type ViewMode = 'day' | 'week' | 'month'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const COLORS = ['#ff6b35','#60a5fa','#4ade80','#fbbf24','#a78bfa','#f472b6']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt(d: Date) { return d.toISOString().split('T')[0] }

export default function CalendarView() {
  const [view, setView] = useState<ViewMode>('week')
  const [current, setCurrent] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [modal, setModal] = useState<{ date: string; time?: string; event?: CalEvent } | null>(null)
  const [form, setForm] = useState({ title: '', date: '', start_time: '', end_time: '', color: '#ff6b35' })

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*').order('date')
    setEvents(data ?? [])
  }

  const openNew = (date: string, time?: string) => {
    setForm({ title: '', date, start_time: time ?? '', end_time: '', color: '#ff6b35' })
    setModal({ date, time })
  }

  const openEdit = (ev: CalEvent) => {
    setForm({ title: ev.title, date: ev.date, start_time: ev.start_time ?? '', end_time: ev.end_time ?? '', color: ev.color })
    setModal({ date: ev.date, event: ev })
  }

  const saveEvent = async () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), date: form.date, start_time: form.start_time || null, end_time: form.end_time || null, color: form.color }
    if (modal?.event) {
      await supabase.from('calendar_events').update(payload).eq('id', modal.event.id)
    } else {
      await supabase.from('calendar_events').insert(payload)
    }
    await loadEvents()
    setModal(null)
  }

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
    setModal(null)
  }

  const eventsOn = (date: string) => events.filter(e => e.date === date)

  // Week helpers
  const getWeekStart = (d: Date) => { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return s }
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(getWeekStart(current)); d.setDate(d.getDate() + i); return d })

  // Month helpers
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
  const monthDays = Array.from({ length: 42 }, (_, i) => { const d = new Date(monthStart); d.setDate(1 - monthStart.getDay() + i); return d })

  const nav = (dir: number) => {
    const d = new Date(current)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrent(d)
  }

  const today = fmt(new Date())

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e22' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronLeft size={16} style={{ color: '#9898a0' }} /></button>
          <h2 className="font-display font-bold text-lg" style={{ color: '#e8e8ea' }}>
            {view === 'day' && `${current.getDate()} ${MONTHS[current.getMonth()]} ${current.getFullYear()}`}
            {view === 'week' && `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`}
            {view === 'month' && `${MONTHS[current.getMonth()]} ${current.getFullYear()}`}
          </h2>
          <button onClick={() => nav(1)} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronRight size={16} style={{ color: '#9898a0' }} /></button>
          <button onClick={() => setCurrent(new Date())} className="px-2 py-1 rounded-lg text-xs font-mono hover:bg-white/10" style={{ color: '#ff6b35' }}>Hoy</button>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#161618' }}>
          {(['day','week','month'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all capitalize"
              style={view === v ? { background: '#ff6b35', color: '#0e0e0f' } : { color: '#6b6b72' }}>
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Day view */}
      {view === 'day' && (
        <div className="flex-1 overflow-auto">
          {HOURS.map(h => {
            const dateStr = fmt(current)
            const hourStr = `${String(h).padStart(2,'0')}:00`
            const hourEvents = eventsOn(dateStr).filter(e => e.start_time?.startsWith(String(h).padStart(2,'0')))
            return (
              <div key={h} className="flex group/hour" style={{ borderBottom: '1px solid #161618', minHeight: 56 }}>
                <div className="w-16 flex-shrink-0 pt-1 px-3 text-xs font-mono" style={{ color: '#4a4a52' }}>
                  {String(h).padStart(2,'0')}:00
                </div>
                <div className="flex-1 p-1 cursor-pointer hover:bg-white/[0.015] relative"
                  onClick={() => openNew(dateStr, hourStr)}>
                  <button className="absolute top-1 right-1 opacity-0 group-hover/hour:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                    style={{ color: '#6b6b72' }}>
                    <Plus size={12} />
                  </button>
                  {hourEvents.map(ev => (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
                      className="px-2 py-1 rounded-lg text-xs font-mono cursor-pointer mb-1 truncate"
                      style={{ background: ev.color + '22', color: ev.color, border: `1px solid ${ev.color}33` }}>
                      {ev.start_time && `${ev.start_time.slice(0,5)} `}{ev.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="grid flex-shrink-0" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid #1e1e22' }}>
            <div />
            {weekDays.map(d => (
              <div key={fmt(d)} className="py-2 text-center">
                <p className="text-xs font-mono" style={{ color: '#6b6b72' }}>{DAYS[d.getDay()]}</p>
                <p className="text-sm font-display font-semibold mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full"
                  style={fmt(d) === today ? { background: '#ff6b35', color: '#0e0e0f' } : { color: '#e8e8ea' }}>
                  {d.getDate()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {HOURS.map(h => (
              <div key={h} className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid #161618', minHeight: 48 }}>
                <div className="pt-1 px-2 text-xs font-mono" style={{ color: '#4a4a52' }}>{String(h).padStart(2,'0')}:00</div>
                {weekDays.map(d => {
                  const dateStr = fmt(d)
                  const hourEvents = eventsOn(dateStr).filter(e => e.start_time?.startsWith(String(h).padStart(2,'0')))
                  return (
                    <div key={dateStr} className="border-l p-0.5 cursor-pointer hover:bg-white/[0.015] group/cell relative"
                      style={{ borderColor: '#161618' }}
                      onClick={() => openNew(dateStr, `${String(h).padStart(2,'0')}:00`)}>
                      {hourEvents.map(ev => (
                        <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
                          className="px-1 py-0.5 rounded text-xs font-mono cursor-pointer mb-0.5 truncate"
                          style={{ background: ev.color + '25', color: ev.color }}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="grid flex-shrink-0" style={{ gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #1e1e22' }}>
            {DAYS.map(d => <div key={d} className="py-2 text-center text-xs font-mono" style={{ color: '#6b6b72' }}>{d}</div>)}
          </div>
          <div className="grid flex-1 overflow-auto" style={{ gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(6,1fr)' }}>
            {monthDays.map(d => {
              const dateStr = fmt(d)
              const isCurrentMonth = d.getMonth() === current.getMonth()
              const dayEvs = eventsOn(dateStr)
              return (
                <div key={dateStr} className="p-1 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  style={{ border: '1px solid #161618', background: dateStr === today ? '#ff6b3508' : undefined }}
                  onClick={() => openNew(dateStr)}>
                  <p className="text-xs font-mono mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                    style={dateStr === today
                      ? { background: '#ff6b35', color: '#0e0e0f', fontWeight: 700 }
                      : { color: isCurrentMonth ? '#9898a0' : '#3a3a3f' }}>
                    {d.getDate()}
                  </p>
                  {dayEvs.slice(0, 3).map(ev => (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
                      className="px-1 py-0.5 rounded text-xs font-mono truncate mb-0.5 cursor-pointer"
                      style={{ background: ev.color + '25', color: ev.color }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvs.length > 3 && <p className="text-xs font-mono" style={{ color: '#6b6b72' }}>+{dayEvs.length - 3}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setModal(null)}>
          <div className="rounded-2xl p-5 w-96" style={{ background: '#161618', border: '1px solid #2a2a2e' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold" style={{ color: '#e8e8ea' }}>{modal.event ? 'Editar evento' : 'Nuevo evento'}</h2>
              <button onClick={() => setModal(null)}><X size={16} style={{ color: '#6b6b72' }} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveEvent()}
                placeholder="Título del evento"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none"
                style={{ background: '#1e1e22', border: '1px solid #2a2a2e', color: '#e8e8ea' }} />
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none"
                style={{ background: '#1e1e22', border: '1px solid #2a2a2e', color: '#e8e8ea' }} />
              <div className="flex gap-2">
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none"
                  style={{ background: '#1e1e22', border: '1px solid #2a2a2e', color: '#e8e8ea' }} />
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none"
                  style={{ background: '#1e1e22', border: '1px solid #2a2a2e', color: '#e8e8ea' }} />
              </div>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {modal.event && (
                <button onClick={() => deleteEvent(modal.event!.id)}
                  className="p-2 rounded-xl hover:bg-red-500/10 transition-colors" style={{ color: '#ef4444' }}>
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl text-sm font-display hover:bg-white/10 transition-colors" style={{ color: '#9898a0' }}>Cancelar</button>
              <button onClick={saveEvent} className="flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-all active:scale-95" style={{ background: '#ff6b35', color: '#0e0e0f' }}>
                {modal.event ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
