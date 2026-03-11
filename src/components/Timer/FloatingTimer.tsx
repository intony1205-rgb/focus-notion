'use client'
import { useState } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Minus, X } from 'lucide-react'
import { useTimer } from '../../lib/timerContext'

const LABELS = { work: 'TRABAJO', short_break: 'DESCANSO CORTO', long_break: 'DESCANSO LARGO' }
const COLORS = { work: '#ff6b35', short_break: '#4ade80', long_break: '#60a5fa' }

export default function FloatingTimer() {
  const timer = useTimer()
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })

  const color = COLORS[timer.mode]
  const C = 2 * Math.PI * 36
  const offset = C * timer.progress

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setOrigin({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging) setPos({ x: e.clientX - origin.x, y: e.clientY - origin.y })
  }
  const onMouseUp = () => setDragging(false)

  if (minimized) return (
    <div className="fixed bottom-6 right-6 z-50 cursor-pointer"
      style={{ transform: `translate(${pos.x}px,${pos.y}px)` }}
      onClick={() => setMinimized(false)}>
      <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: '#161618', border: `2px solid ${color}`, boxShadow: `0 0 20px ${color}40` }}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="36" fill="none" stroke="#2a2a2e" strokeWidth="3" />
          <circle cx="44" cy="44" r="36" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={C} strokeDashoffset={C - offset} strokeLinecap="round" />
        </svg>
        <span className="font-mono text-xs font-bold relative z-10" style={{ color }}>{timer.display}</span>
      </div>
    </div>
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none"
      style={{ transform: `translate(${pos.x}px,${pos.y}px)` }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#161618', border: '1px solid #2a2a2e', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', width: 210 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing"
          style={{ background: '#111113', borderBottom: '1px solid #2a2a2e' }}
          onMouseDown={onMouseDown}>
          <span className="text-xs font-mono font-semibold tracking-widest" style={{ color }}>{LABELS[timer.mode]}</span>
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-white/10">
            <Minus size={10} className="text-muted" />
          </button>
        </div>

        {/* Active task */}
        {timer.activeTaskName && (
          <div className="px-3 py-1.5 flex items-center justify-between"
            style={{ background: color + '12', borderBottom: `1px solid ${color}25` }}>
            <span className="text-xs font-mono truncate flex-1" style={{ color }}>{timer.activeTaskName}</span>
            <button onClick={timer.stopTask} className="ml-2 p-0.5 rounded hover:bg-white/10 flex-shrink-0">
              <X size={10} style={{ color }} />
            </button>
          </div>
        )}

        {/* Circle */}
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="relative w-24 h-24">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#2a2a2e" strokeWidth="4" />
              <circle cx="44" cy="44" r="36" fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={C} strokeDashoffset={C - offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold" style={{ color }}>{timer.display}</span>
              <span className="text-xs font-mono text-muted">#{timer.completedPomodoros + 1}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={timer.reset} className="p-1.5 rounded-lg hover:bg-white/10">
              <RotateCcw size={13} className="text-muted" />
            </button>
            <button onClick={timer.toggle}
              className="px-4 py-2 rounded-xl font-mono font-bold text-sm transition-all active:scale-95 flex items-center gap-1.5"
              style={{ background: color, color: '#0e0e0f' }}>
              {timer.isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button onClick={timer.skip} className="p-1.5 rounded-lg hover:bg-white/10">
              <SkipForward size={13} className="text-muted" />
            </button>
          </div>

          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: i < timer.completedPomodoros % 4 ? color : '#2a2a2e' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
