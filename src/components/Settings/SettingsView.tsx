'use client'
import { useState, useEffect } from 'react'
import { Timer, Bell, Check, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTimer } from '../../lib/timerContext'

type Config = { work: number; shortBreak: number; longBreak: number; interval: number; sound: boolean }

export default function SettingsView() {
  const [config, setConfig] = useState<Config>({ work: 25, shortBreak: 5, longBreak: 15, interval: 4, sound: true })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configId, setConfigId] = useState<string | null>(null)
  const { reloadConfig } = useTimer()

  useEffect(() => {
    supabase.from('user_config').select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setConfig({ work: data.work_minutes, shortBreak: data.short_break_minutes, longBreak: data.long_break_minutes, interval: data.interval_count, sound: data.sound })
        setConfigId(data.id)
      }
      setLoading(false)
    })
  }, [])

  const set = (k: keyof Config, v: number | boolean) => setConfig(c => ({ ...c, [k]: v }))

  const save = async () => {
    const payload = { work_minutes: config.work, short_break_minutes: config.shortBreak, long_break_minutes: config.longBreak, interval_count: config.interval, sound: config.sound, updated_at: new Date().toISOString() }
    if (configId) await supabase.from('user_config').update(payload).eq('id', configId)
    else {
      const { data } = await supabase.from('user_config').insert(payload).select().single()
      if (data) setConfigId(data.id)
    }
    await reloadConfig()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const NumField = ({ label, desc, k, min, max, unit }: { label: string; desc: string; k: keyof Config; min: number; max: number; unit?: string }) => {
    const val = config[k] as number
    return (
      <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid #1e1e22' }}>
        <div>
          <p className="text-sm font-mono" style={{ color: '#e8e8ea' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6b72' }}>{desc}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => set(k, Math.max(min, val - 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 transition-colors font-mono"
            style={{ color: '#9898a0' }}>−</button>
          <input type="number" min={min} max={max} value={val}
            onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= min && n <= max) set(k, n) }}
            className="w-16 text-center py-2 rounded-xl font-mono font-bold text-lg outline-none"
            style={{ background: '#1e1e22', border: '1px solid #2a2a2e', color: '#ff6b35' }} />
          {unit && <span className="text-xs font-mono w-8" style={{ color: '#6b6b72' }}>{unit}</span>}
          <button onClick={() => set(k, Math.min(max, val + 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 transition-colors font-mono"
            style={{ color: '#9898a0' }}>+</button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={22} className="text-accent animate-spin" /></div>

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e22' }}>
        <h1 className="font-display font-bold text-xl" style={{ color: '#e8e8ea' }}>Configuración</h1>
      </div>
      <div className="p-6 flex flex-col gap-4 max-w-md">
        <div className="rounded-2xl p-5" style={{ background: '#161618', border: '1px solid #2a2a2e' }}>
          <div className="flex items-center gap-2 mb-1">
            <Timer size={15} style={{ color: '#ff6b35' }} />
            <h2 className="font-display font-semibold text-sm" style={{ color: '#e8e8ea' }}>Temporizador Pomodoro</h2>
          </div>
          <NumField label="Tiempo de trabajo" desc="Duración de cada sesión" k="work" min={1} max={120} unit="min" />
          <NumField label="Descanso corto" desc="Pausa entre pomodoros" k="shortBreak" min={1} max={30} unit="min" />
          <NumField label="Descanso largo" desc="Pausa después de varios pomodoros" k="longBreak" min={5} max={60} unit="min" />
          <NumField label="Intervalo" desc="Pomodoros antes del descanso largo" k="interval" min={1} max={10} />
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#161618', border: '1px solid #2a2a2e' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} style={{ color: '#60a5fa' }} />
            <h2 className="font-display font-semibold text-sm" style={{ color: '#e8e8ea' }}>Notificaciones</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono" style={{ color: '#c8c8cc' }}>Sonido al terminar</p>
              <p className="text-xs mt-0.5" style={{ color: '#6b6b72' }}>Reproducir sonido al completar un pomodoro</p>
            </div>
            <button onClick={() => set('sound', !config.sound)}
              className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: config.sound ? '#ff6b35' : '#2a2a2e' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: config.sound ? '22px' : '2px' }} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#161618', border: '1px solid #2a2a2e' }}>
          <p className="text-xs font-mono" style={{ color: '#6b6b72' }}>
            Sesión completa: <span className="font-bold" style={{ color: '#ff6b35' }}>{config.work * config.interval + config.shortBreak * (config.interval - 1) + config.longBreak} min</span>
            <span style={{ color: '#4a4a52' }}> · {config.interval} × {config.work} min</span>
          </p>
        </div>

        <button onClick={save}
          className="py-3 rounded-xl font-display font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: saved ? '#4ade80' : '#ff6b35', color: '#0e0e0f' }}>
          {saved ? <><Check size={15} /> Guardado — timer actualizado</> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
