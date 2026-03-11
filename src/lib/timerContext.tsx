'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'

type TimerMode = 'work' | 'short_break' | 'long_break'

type TimerContextType = {
  mode: TimerMode
  isRunning: boolean
  display: string
  progress: number
  completedPomodoros: number
  activeTaskId: string | null
  activeTaskName: string | null
  workMinutes: number
  toggle: () => void
  reset: () => void
  skip: () => void
  startTask: (taskId: string, taskName: string) => void
  stopTask: () => void
  reloadConfig: () => Promise<void>
}

const TimerContext = createContext<TimerContextType | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [workMin, setWorkMin] = useState(25)
  const [shortBreak, setShortBreak] = useState(5)
  const [longBreak, setLongBreak] = useState(15)
  const [intervalCount, setIntervalCount] = useState(4)
  const [mode, setMode] = useState<TimerMode>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeTaskName, setActiveTaskName] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const loadConfig = useCallback(async () => {
    const { data } = await supabase.from('user_config').select('*').limit(1).single()
    if (data) {
      setWorkMin(data.work_minutes)
      setShortBreak(data.short_break_minutes)
      setLongBreak(data.long_break_minutes)
      setIntervalCount(data.interval_count)
      setIsRunning(false)
      setMode('work')
      setSecondsLeft(data.work_minutes * 60)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const getDuration = useCallback((m: TimerMode) => {
    if (m === 'work') return workMin * 60
    if (m === 'short_break') return shortBreak * 60
    return longBreak * 60
  }, [workMin, shortBreak, longBreak])

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          setIsRunning(false)
          if (mode === 'work') {
            setCompletedPomodoros(prev => {
              const next = prev + 1
              if (activeTaskId) {
                supabase.from('tasks').select('completed_pomodoros').eq('id', activeTaskId).single().then(({ data }) => {
                  if (data) supabase.from('tasks').update({ completed_pomodoros: data.completed_pomodoros + 1 }).eq('id', activeTaskId)
                })
              }
              const nextMode: TimerMode = next % intervalCount === 0 ? 'long_break' : 'short_break'
              setMode(nextMode)
              setSecondsLeft(nextMode === 'long_break' ? longBreak * 60 : shortBreak * 60)
              return next
            })
          } else {
            setMode('work')
            setSecondsLeft(workMin * 60)
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, mode, intervalCount, workMin, shortBreak, longBreak, activeTaskId])

  const toggle = () => setIsRunning(r => !r)
  const reset = () => { setIsRunning(false); setSecondsLeft(getDuration(mode)) }
  const skip = () => {
    setIsRunning(false)
    if (mode === 'work') { setMode('short_break'); setSecondsLeft(shortBreak * 60) }
    else { setMode('work'); setSecondsLeft(workMin * 60) }
  }
  const startTask = (taskId: string, taskName: string) => {
    setActiveTaskId(taskId)
    setActiveTaskName(taskName)
    setMode('work')
    setSecondsLeft(workMin * 60)
    setIsRunning(true)
  }
  const stopTask = () => {
    setIsRunning(false)
    setActiveTaskId(null)
    setActiveTaskName(null)
    setMode('work')
    setSecondsLeft(workMin * 60)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const progress = secondsLeft / getDuration(mode)

  return (
    <TimerContext.Provider value={{
      mode, isRunning,
      display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      progress, completedPomodoros, activeTaskId, activeTaskName, workMinutes: workMin,
      toggle, reset, skip, startTask, stopTask, reloadConfig: loadConfig,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be inside TimerProvider')
  return ctx
}
