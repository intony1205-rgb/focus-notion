import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Task } from '@/types/database'

export type TimerMode = 'focus' | 'short_break' | 'long_break'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

interface TimerState {
  mode: TimerMode
  status: TimerStatus
  secondsLeft: number
  activeTask: Task | null
  currentSessionId: string | null
  pomodoroCount: number
  setMode: (mode: TimerMode) => void
  setActiveTask: (task: Task | null) => void
  setCurrentSessionId: (id: string | null) => void
  start: () => void
  pause: () => void
  resume: () => void
  tick: () => void
  reset: () => void
  complete: () => void
}

export const useTimerStore = create<TimerState>()(
  devtools(
    (set, get) => ({
      mode: 'focus',
      status: 'idle',
      secondsLeft: DURATIONS.focus,
      activeTask: null,
      currentSessionId: null,
      pomodoroCount: 0,
      setMode: (mode) => set({ mode, secondsLeft: DURATIONS[mode], status: 'idle' }),
      setActiveTask: (task) => set({ activeTask: task }),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      start: () => set({ status: 'running' }),
      pause: () => set({ status: 'paused' }),
      resume: () => set({ status: 'running' }),
      tick: () => {
        const { secondsLeft } = get()
        if (secondsLeft <= 1) set({ secondsLeft: 0, status: 'completed' })
        else set({ secondsLeft: secondsLeft - 1 })
      },
      reset: () => {
        const { mode } = get()
        set({ secondsLeft: DURATIONS[mode], status: 'idle', currentSessionId: null })
      },
      complete: () => {
        const { mode, pomodoroCount } = get()
        const newCount = mode === 'focus' ? pomodoroCount + 1 : pomodoroCount
        set({ status: 'completed', pomodoroCount: newCount, currentSessionId: null })
      },
    }),
    { name: 'PomodoroTimer' }
  )
)

export { DURATIONS }