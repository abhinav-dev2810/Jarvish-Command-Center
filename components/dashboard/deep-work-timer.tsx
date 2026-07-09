'use client'

import { Play, Pause, RotateCcw } from 'lucide-react'
import { useFocusMode } from '@/context/focus-mode-context'

export function DeepWorkTimer() {
  const {
    isRunning,
    timeLeft,
    selectedDuration,
    setSelectedDuration,
    startFocus,
    stopFocus,
    resetFocus,
  } = useFocusMode()

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100

  const handleDurationChange = (mins: number) => {
    setSelectedDuration(mins)
  }

  const handleStart = () => {
    startFocus('Jarvish_Core_Build')
  }

  const handlePause = () => {
    stopFocus()
  }

  const handleReset = () => {
    resetFocus()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="mb-6 text-sm font-semibold text-foreground">Deep Work Timer</h2>

      {/* Circular progress ring */}
      <div className="flex justify-center mb-8">
        <div className="relative size-48">
          <svg
            className="absolute inset-0 transform -rotate-90"
            viewBox="0 0 200 200"
          >
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="var(--border)"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-5xl font-semibold text-foreground tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>

          {/* Glow effect on ring */}
          <style>{`
            circle[stroke="var(--primary)"] {
              filter: drop-shadow(0 0 6px rgba(46, 92, 255, 0.3));
            }
          `}</style>
        </div>
      </div>

      {/* Duration presets */}
      <div className="flex gap-2 justify-center mb-6">
        {[25, 45, 60].map((duration) => (
          <button
            key={duration}
            onClick={() => handleDurationChange(duration)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              selectedDuration === duration
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-foreground hover:bg-border'
            }`}
            disabled={isRunning}
          >
            {duration}m
          </button>
        ))}
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 justify-center">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2 font-medium hover:shadow-md transition-all duration-150"
          >
            <Play className="size-4" />
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2 font-medium hover:shadow-md transition-all duration-150"
          >
            <Pause className="size-4" />
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-full border border-border bg-card text-foreground px-6 py-2 font-medium hover:bg-muted transition-all duration-150"
        >
          <RotateCcw className="size-4" />
          Reset
        </button>
      </div>
    </div>
  )
}