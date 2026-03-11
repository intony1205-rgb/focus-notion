export type TaskStatus = 'backlog' | 'in_progress' | 'completed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SessionType = 'focus' | 'short_break' | 'long_break'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  color: string
  estimated_pomodoros: number
  completed_pomodoros: number
  due_date: string | null
  tags: string[]
  position: number
  created_at: string
  updated_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  type: SessionType
  started_at: string
  ended_at: string | null
  duration_secs: number | null
  completed: boolean
  notes: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  task_id: string | null
  title: string
  description: string | null
  color: string
  start_time: string
  end_time: string
  all_day: boolean
  recurrence: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type TaskInsert = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<TaskInsert>
export type FocusSessionInsert = Omit<FocusSession, 'id' | 'user_id' | 'created_at'>
export type FocusSessionUpdate = Partial<FocusSessionInsert>
export type CalendarEventInsert = Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type CalendarEventUpdate = Partial<CalendarEventInsert>

export interface Database {
  public: {
    Tables: {
      tasks: { Row: Task; Insert: TaskInsert & { user_id?: string }; Update: TaskUpdate }
      focus_sessions: { Row: FocusSession; Insert: FocusSessionInsert & { user_id?: string }; Update: FocusSessionUpdate }
      calendar_events: { Row: CalendarEvent; Insert: CalendarEventInsert & { user_id?: string }; Update: CalendarEventUpdate }
    }
    Views: { daily_pomodoro_summary: { Row: { user_id: string; day: string; completed_pomodoros: number; total_pomodoros: number; total_focus_secs: number } } }
    Functions: Record<string, never>
    Enums: { task_status: TaskStatus; task_priority: TaskPriority; session_type: SessionType }
  }
}


