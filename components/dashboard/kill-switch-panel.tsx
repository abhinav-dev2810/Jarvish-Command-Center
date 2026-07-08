'use client'

import { useState } from 'react'

interface App {
  id: string
  name: string
  blocked: boolean
}

const DEFAULT_APPS: App[] = [
  { id: 'slack', name: 'Slack', blocked: false },
  { id: 'twitter', name: 'Twitter', blocked: false },
  { id: 'gmail', name: 'Gmail', blocked: false },
  { id: 'youtube', name: 'YouTube', blocked: false },
  { id: 'reddit', name: 'Reddit', blocked: false },
  { id: 'news', name: 'News Sites', blocked: true },
]

export function KillSwitchPanel() {
  const [apps, setApps] = useState<App[]>(DEFAULT_APPS)
  const [focusModeOn, setFocusModeOn] = useState(false)
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  const toggleAppBlock = (id: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === id ? { ...app, blocked: !app.blocked } : app
      )
    )
  }

  // 🔥 THE ADVANCED HANDSHAKE FUNCTION (BLOCK & UNBLOCK)
  const toggleFocusMode = async () => {
    const newState = !focusModeOn
    setFocusModeOn(newState)

    if (newState) {
      // 1. Block apps locally in UI
      setApps((prevApps) => prevApps.map((app) => ({
        ...app, blocked: ['slack', 'twitter', 'youtube', 'reddit'].includes(app.id),
      })))

      // 2. Send BLOCK Command to Python
      try {
        const response = await fetch('http://127.0.0.1:5000/block')
        const data = await response.json()
        setServerMessage(data.status === "Error" ? `🔴 ${data.message}` : `🟢 ${data.message}`)
        setTimeout(() => setServerMessage(null), 4000)
      } catch (error) {
        setServerMessage("🔴 ERROR: System Controller is Offline!")
        setTimeout(() => setServerMessage(null), 4000)
      }
    } else {
      // 1. Unblock apps locally in UI
      setApps((prevApps) => prevApps.map((app) => ({ ...app, blocked: false })))

      // 2. Send UNBLOCK Command to Python
      try {
        const response = await fetch('http://127.0.0.1:5000/unblock')
        const data = await response.json()
        setServerMessage(data.status === "Error" ? `🔴 ${data.message}` : `🟢 ${data.message}`)
        setTimeout(() => setServerMessage(null), 4000)
      } catch (error) {
        setServerMessage("🔴 ERROR: System Controller is Offline!")
        setTimeout(() => setServerMessage(null), 4000)
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-foreground">Kill-Switch Panel</h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              focusModeOn ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Focus Mode
          </span>
          {/* iOS-style toggle */}
          <button
            onClick={toggleFocusMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              focusModeOn ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                focusModeOn ? 'translate-x-5' : 'translate-x-0.5'
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
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors duration-150 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{app.name}</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  app.blocked
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {app.blocked ? '🔴 Blocked' : '✓ Allowed'}
              </span>
            </div>

            {/* Toggle button */}
            <button
              onClick={() => toggleAppBlock(app.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                app.blocked ? 'bg-destructive/20' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  app.blocked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Status indicator */}
      <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          {apps.filter((a) => a.blocked).length} of {apps.length} apps blocked
        </p>
      </div>
    </div>
  )
}