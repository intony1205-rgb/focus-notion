import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { DashboardShell } from './DashboardShell'

export default async function DashboardPage() {
  const supabase = createServerClient(cookies())
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]
  const [{ data: tasks }, { data: events }] = await Promise.all([
    supabase.from('tasks').select('*').order('position'),
    supabase.from('calendar_events').select('*')
      .gte('start_time', `${today}T00:00:00Z`)
      .lte('start_time', `${today}T23:59:59Z`)
      .order('start_time'),
  ])

  return <DashboardShell initialTasks={tasks ?? []} initialEvents={events ?? []} />
}