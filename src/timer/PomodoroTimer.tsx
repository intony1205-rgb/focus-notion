'use client'
import { useState } from 'react'
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer'
import { useTimerStore } from '@/store/timerStore'
import { useTasksStore } from '@/store/tasksStore'
import type { TimerMode } from '@/store/timerStore'

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus', short_break: 'Short Break', long_break: 'Long Break',
}
const MODE_COLORS: Record<TimerMode, string> = {
  focus: '#ef4444', short_break: '#22c55e', long_break: '#3b82f6',
}

export function PomodoroTimer() {
  const { mode, status, formattedTime, progress, activeTask, pomodoroCount, handleStart, pause, resume, reset, setMode, setActiveTask } = usePomodoroTimer()
  const { tasks } = useTasksStore()
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived')
  const R = 88
  const CIRC = 2 * Math.PI * R
  const dashOffset = CIRC * (1 - progress)
  const color = MODE_COLORS[mode]

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="flex gap-1 p-1 bg-zinc-800 rounded-xl">
        {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); reset() }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200" width="208" height="208">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#3f3f46" strokeWidth="10" />
          <circle cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="text-5xl font-mono font-bold text-white tracking-tight">{formattedTime}</span>
          <span className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">
            {status === 'idle' ? mode.replace('_', ' ') : status}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < pomodoroCount % 4 ? 'bg-red-500 scale-110' : 'bg-zinc-700'}`} />
        ))}
      </div>

      <div className="w-full">
        {activeTask ? (
          <div onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer hover:border-zinc-500 transition">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: activeTask.color }} />
              <span className="text-sm text-zinc-200 truncate">{activeTask.title}</span>
            </div>
            <span className="text-xs text-zinc-400 ml-2">{activeTask.completed_pomodoros}/{activeTask.estimated_pomodoros} 🍅</span>
          </div>
        ) : (
          <button onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-dashed border-zinc-600 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition">
            + Select a task
          </button>
        )}
        {showTaskPicker && (
          <div className="mt-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {activeTasks.length === 0 ? (
              <p className="px-3 py-3 text-sm text-zinc-500 text-center">No tasks yet!</p>
            ) : activeTasks.map((task) => (
              <button key={task.id} onClick={() => { setActiveTask(task); setShowTaskPicker(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-700 transition ${activeTask?.id === task.id ? 'bg-zinc-700' : ''}`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.color }} />
                <span className="truncate text-zinc-200">{task.title}</span>
                <span className="ml-auto text-xs text-zinc-500">{task.completed_pomodoros}/{task.estimated_pomodoros} 🍅</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {status === 'idle' && (
          <button onClick={handleStart} className="px-8 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95" style={{ background: color }}>Start</button>
        )}
        {status === 'running' && (
          <button onClick={pause} className="px-8 py-2.5 rounded-xl font-semibold text-sm bg-zinc-700 text-white hover:bg-zinc-600 transition-all active:scale-95">Pause</button>
        )}
        {status === 'paused' && (<>
          <button onClick={resume} className="px-8 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95" style={{ background: color }}>Resume</button>
          <button onClick={reset} className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-all">Reset</button>
        </>)}
        {status === 'completed' && (
          <button onClick={reset} className="px-8 py-2.5 rounded-xl font-semibold text-sm bg-zinc-700 text-white hover:bg-zinc-600 transition-all active:scale-95">Next →</button>
        )}
      </div>
    </div>
  )
}