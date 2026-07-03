'use client'

import { Clock, CheckCircle2, Zap } from 'lucide-react'

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

export function StatsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        icon={<Clock className="size-6" />}
        label="Focus Hours Today"
        value="5.2h"
        delta="+0.8h vs yesterday"
      />
      <StatCard
        icon={<CheckCircle2 className="size-6" />}
        label="Completed Projects"
        value="12"
        delta="+3 vs yesterday"
      />
      <StatCard
        icon={<Zap className="size-6" />}
        label="Current Streak"
        value="18"
        delta="+2 days"
      />
    </div>
  )
}
