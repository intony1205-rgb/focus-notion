'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { TimerProvider } from '../lib/timerContext'
import Sidebar from '../components/Layout/Sidebar'
import FloatingTimer from '../components/Timer/FloatingTimer'

const ProjectsView = dynamic(() => import('../components/Projects/ProjectsView'), { ssr: false })
const CalendarView = dynamic(() => import('../components/Calendar/CalendarView'), { ssr: false })
const MetricsView = dynamic(() => import('../components/Metrics/MetricsView'), { ssr: false })
const SettingsView = dynamic(() => import('../components/Settings/SettingsView'), { ssr: false })

export type Tab = 'projects' | 'calendar' | 'metrics' | 'settings'

export default function Home() {
  const [tab, setTab] = useState<Tab>('projects')
  return (
    <TimerProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0e0e0f' }}>
        <Sidebar active={tab} onChange={setTab} />
        <main className="flex-1 overflow-hidden">
          {tab === 'projects' && <ProjectsView />}
          {tab === 'calendar' && <CalendarView />}
          {tab === 'metrics' && <MetricsView />}
          {tab === 'settings' && <SettingsView />}
        </main>
        <FloatingTimer />
      </div>
    </TimerProvider>
  )
}
