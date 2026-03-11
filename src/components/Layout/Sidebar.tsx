'use client'
import { Calendar, BarChart2, FolderOpen, Settings } from 'lucide-react'
import { Tab } from '../../app/page'

const ITEMS = [
  { id: 'projects', icon: FolderOpen },
  { id: 'calendar', icon: Calendar },
  { id: 'metrics', icon: BarChart2 },
  { id: 'settings', icon: Settings },
] as const

export default function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex flex-col items-center py-4 gap-2 flex-shrink-0"
      style={{ width: 56, background: '#0a0a0b', borderRight: '1px solid #1e1e22' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 font-display font-black text-sm"
        style={{ background: '#ff6b35', color: '#0e0e0f' }}>F</div>
      {ITEMS.map(({ id, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={active === id
            ? { background: '#ff6b35', color: '#0e0e0f' }
            : { color: '#6b6b72' }}>
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
