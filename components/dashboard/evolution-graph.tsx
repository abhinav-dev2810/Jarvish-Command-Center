'use client'

import { useState, useEffect } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKS_PER_MONTH = 4

function getColor(value: number): string {
  if (value === 0) return '#F5F5F5'
  if (value <= 2) return '#E4ECFF'
  if (value <= 4) return '#60A5FA'
  if (value <= 6) return '#2E5CFF'
  return '#1A3FCC'
}

export function EvolutionGraph() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [data, setData] = useState<number[]>([])

  // The Fix: Generate data only after the component mounts on the client
  useEffect(() => {
    const generateData = () => {
      const newData = []
      for (let i = 0; i < 52; i++) {
        newData.push(Math.floor(Math.random() * 8))
      }
      return newData
    }
    setData(generateData())
  }, [])

  const handleHover = (index: number) => {
    setHoveredIndex(index)
  }

  const weeks = Array.from({ length: 52 }, (_, i) => i)
  
  const getDateForWeek = (weekIndex: number) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const date = new Date(startOfYear.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getTaksForWeek = (weekIndex: number) => {
    return Math.floor(Math.random() * 8)
  }

  return (
    <div className="rounded-2xl border border-border bg-card dark:bg-card p-6 shadow-sm dark:shadow-lg">
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Self-Investment Tracker
        </h2>
        <p className="text-xs text-muted-foreground">
          Track your focus hours and task completion across the year
        </p>
      </div>

      {/* Month labels */}
      <div className="mb-4 flex gap-2">
        {MONTHS.map((month) => (
          <div
            key={month}
            className="flex-1 text-xs font-medium text-muted-foreground text-center"
          >
            {month}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="inline-grid gap-1 mb-6" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
        {data.length > 0 ? (
          weeks.map((week) => (
            <div
              key={week}
              className="group relative cursor-pointer"
              onMouseEnter={() => handleHover(week)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="h-5 w-5 rounded transition-all duration-150 hover:shadow-lg hover:scale-110 dark:hover:shadow-xl"
                style={{
                  backgroundColor: getColor(data[week]),
                  opacity: hoveredIndex === null || hoveredIndex === week ? 1 : 0.4,
                }}
              />
              {hoveredIndex === week && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap rounded-lg bg-foreground dark:bg-card px-3 py-2 text-xs font-medium text-card dark:text-foreground z-10 pointer-events-none shadow-lg border border-border dark:border-border">
                  <div className="font-semibold">{getDateForWeek(week)}</div>
                  <div className="text-card dark:text-muted-foreground text-xs mt-1">{data[week]}.5h Focus • {getTaksForWeek(week)} Tasks</div>
                </div>
              )}
            </div>
          ))
        ) : (
           // Placeholder logic to avoid empty spacing while generating
            <div className="col-span-13 text-center text-sm text-muted-foreground py-4">Loading tracker...</div>
        )}
      </div>

      {/* Enhanced Legend with Description */}
      <div className="rounded-lg bg-muted dark:bg-muted/50 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Focus Intensity
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Low Focus</span>
          <div className="flex gap-1.5">
            {[0, 2, 4, 6, 8].map((val) => (
              <div
                key={val}
                className="h-4 w-4 rounded transition-all hover:scale-125 cursor-help"
                title={`${val}-${val+2}h daily focus`}
                style={{ backgroundColor: getColor(val) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">High Focus</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Darker shades indicate more focus hours and tasks completed
        </p>
      </div>
    </div>
  )
}