import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Task } from '@/types/database'

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  reorderTasks: (orderedIds: string[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set({ tasks: [...get().tasks, task] }),
      updateTask: (id, updates) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }),
      removeTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
      reorderTasks: (orderedIds) => {
        const map = Object.fromEntries(get().tasks.map((t) => [t.id, t]))
        const reordered = orderedIds.map((id, i) => ({ ...map[id], position: i }))
        set({ tasks: reordered })
      },
      setLoading: (v) => set({ isLoading: v }),
      setError: (e) => set({ error: e }),
    }),
    { name: 'TasksStore' }
  )
)