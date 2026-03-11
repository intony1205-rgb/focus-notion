'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore, DURATIONS } from '@/store/timerStore'
import { useTasksStore } from '@/store/tasksStore'
import { createBrowserClient } from '@/lib/supabase'

export function usePomodoroTimer() {
  const store = useTimerStore()
  const { updateTask } = useTasksStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createBrowserClient()

  const handleStart = useCallback(async () => {
    const { mode, activeTask, setCurrentSessionId, start } = useTimerStore.getState()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, task_id: activeTask?.id ?? null, type: mode, started_at: new Date().toISOString() })
        .select()
        .single()
      if (!error && data) setCurrentSessionId(data.id)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
    start()
  }, [supabase])

  const handleComplete = useCallback(async () => {
    const { mode, currentSessionId, activeTask, complete } = useTimerStore.getState()
    const elapsed = DURATIONS[mode]
    complete()
    if (!currentSessionId) return
    try {
      await supabase
        .from('focus_sessions')
        .update({ ended_at: new Date().toISOString(), duration_secs: elapsed, completed: true })
        .eq('id', currentSessionId)
      if (mode === 'focus' && activeTask) {
        const newCount = activeTask.completed_pomodoros + 1
        const isTaskDone = newCount >= activeTask.estimated_pomodoros
        const { data: updatedTask } = await supabase
          .from('tasks')
          .update({ completed_pomodoros: newCount, status: isTaskDone ? 'completed' : activeTask.status })
          .eq('id', activeTask.id)
          .select()
          .single()
        if (updatedTask) {
          updateTask(activeTask.id, updatedTask)
          useTimerStore.getState().setActiveTask(updatedTask)
        }
      }
    } catch (err) {
      console.error('Failed to complete session:', err)
    }
  }, [supabase, updateTask])

  useEffect(() => {
    if (store.status === 'running') {
      intervalRef.current = setInterval(() => {
        const { status, tick } = useTimerStore.getState()
        if (status === 'running') tick()
      }, 1000)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [store.status])

  useEffect(() => {
    if (store.status === 'completed' && store.secondsLeft === 0) handleComplete()
  }, [store.status, store.secondsLeft]) // eslint-disable-line

  const formattedTime = (() => {
    const m = Math.floor(store.secondsLeft / 60)
    const s = store.secondsLeft % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()

  const progress = 1 - store.secondsLeft / DURATIONS[store.mode]

  return { ...store, formattedTime, progress, handleStart, handleComplete }
}