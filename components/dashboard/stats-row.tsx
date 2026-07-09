'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, Zap, Loader2 } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  delta: string
}

function StatCard({ icon, label, value, delta }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-primary font-medium">{delta}</p>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </div>
  )
}

interface TodayStats {
  date: string
  total_focus_hours: number
  tasks_completed: number
  streak_days: number
  focus_active: boolean
}

export function StatsRow() {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8008/stats/today')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data: TodayStats = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Stats backend (8008) failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm col-span-3 flex items-center justify-center text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" />
          Loading stats...
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        icon={<Clock className="size-6" />}
        label="Focus Hours Today"
        value={`${(stats?.total_focus_hours ?? 0).toFixed(1)}h`}
        delta={stats?.focus_active ? '🟢 Session active now' : 'No active session'}
      />
      <StatCard
        icon={<CheckCircle2 className="size-6" />}
        label="Tasks Completed Today"
        value={`${stats?.tasks_completed ?? 0}`}
        delta="Synced from today's sessions"
      />
      <StatCard
        icon={<Zap className="size-6" />}
        label="Current Streak"
        value={`${stats?.streak_days ?? 0}`}
        delta={stats?.streak_days ? `${stats.streak_days} day(s) in a row` : 'Start your streak today'}
      />
    </div>
  )
}