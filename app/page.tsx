'use client'

import { Header } from '@/components/dashboard/header'
import { StatsRow } from '@/components/dashboard/stats-row'
import { EvolutionGraph } from '@/components/dashboard/evolution-graph'
import { DeepWorkTimer } from '@/components/dashboard/deep-work-timer'
import { KillSwitchPanel } from '@/components/dashboard/kill-switch-panel'
import { TaskManager } from '@/components/dashboard/task-manager'
import { FridayFeed } from '@/components/dashboard/friday-feed'
import { FocusModeProvider } from '@/context/focus-mode-context'

export default function Page() {
  return (
  <FocusModeProvider> 
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Quick Stats Row */}
        <StatsRow />

        {/* Evolution Graph */}
        <EvolutionGraph />

        {/* Three-column row: Timer, Tasks, and Kill Switch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DeepWorkTimer />
          <TaskManager />
          <KillSwitchPanel />
        </div>

        {/* Friday's Feed */}
        <FridayFeed />
      </div>
    </main>
    </FocusModeProvider>
  )
}
