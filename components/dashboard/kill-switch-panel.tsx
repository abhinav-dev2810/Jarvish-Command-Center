'use client'

import { useState } from 'react'
import { useFocusMode } from '@/context/focus-mode-context'

interface App {
  id: string
  name: string
}

const APPS: App[] = [
  { id: 'slack', name: 'Slack' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'gmail', name: 'Gmail' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'news', name: 'News Sites' },
]

// Ye apps hamesha focus mode ON hote hi block ho jaate hain (kill_switch.py se match)
const AUTO_BLOCKED_ON_FOCUS = ['slack', 'twitter', 'youtube', 'reddit']

export function KillSwitchPanel() {
  const { isRunning, serverMessage, startFocus, stopFocus } = useFocusMode()

  // "News Sites" jaisa manual-only toggle abhi bhi local rakha hai,
  // kyunki wo focus-mode se automatically connected nahi hai.
  const [manualBlocks, setManualBlocks] = useState<Record<string, boolean>>({
    news: true,
  })

  const toggleManualBlock = (id: string) => {
    setManualBlocks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleFocusMode = async () => {
    if (isRunning) {
      await stopFocus()
    } else {
      await startFocus('Jarvish_Core_Build')
    }
  }

  const isAppBlocked = (id: string) => {
    if (AUTO_BLOCKED_ON_FOCUS.includes(id)) {
      return isRunning
    }
    return !!manualBlocks[id]
  }

  const blockedCount = APPS.filter((app) => isAppBlocked(app.id)).length

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-foreground">Kill-Switch Panel</h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              isRunning ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Focus Mode
          </span>
          {/* iOS-style toggle */}
          <button
            onClick={toggleFocusMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              isRunning ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                isRunning ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Python Server Feedback Message */}
      {serverMessage && (
        <div className="mb-4 text-xs font-semibold px-3 py-2 rounded-lg bg-background border border-border animate-in fade-in slide-in-from-top-2">
          {serverMessage}
        </div>
      )}

      {/* Apps list */}
      <div className="space-y-3">
        {APPS.map((app) => {
          const blocked = isAppBlocked(app.id)
          const isAutoManaged = AUTO_BLOCKED_ON_FOCUS.includes(app.id)
          return (
            <div
              key={app.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors duration-150 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{app.name}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    blocked
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {blocked ? '🔴 Blocked' : '✓ Allowed'}
                </span>
              </div>

              {/* Toggle button — auto-managed apps ke liye disabled, kyunki
                  unka status Focus Mode se automatically decide hota hai */}
              <button
                onClick={() => !isAutoManaged && toggleManualBlock(app.id)}
                disabled={isAutoManaged}
                title={isAutoManaged ? 'Focus Mode se automatically control hota hai' : ''}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  blocked ? 'bg-destructive/20' : 'bg-border'
                } ${isAutoManaged ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                    blocked ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>

      {/* Status indicator */}
      <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          {blockedCount} of {APPS.length} apps blocked
        </p>
      </div>
    </div>
  )
}