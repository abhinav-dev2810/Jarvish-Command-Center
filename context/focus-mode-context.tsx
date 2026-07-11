'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FocusModeContextType {
  isRunning: boolean
  timeLeft: number
  selectedDuration: number
  serverMessage: string | null
  setSelectedDuration: (minutes: number) => void
  startFocus: (projectTag?: string) => Promise<void>
  stopFocus: () => Promise<void>
  resetFocus: () => Promise<void>
  incrementTasksCompleted: () => void
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined)

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false)
  const [selectedDuration, setSelectedDurationState] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [tasksCompletedThisSession, setTasksCompletedThisSession] = useState(0)

  // Countdown logic — jab bhi isRunning true ho, timer chalta rahega
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const flashMessage = (msg: string) => {
    setServerMessage(msg)
    setTimeout(() => setServerMessage(null), 4000)
  }

  const setSelectedDuration = (minutes: number) => {
    if (!isRunning) {
      setSelectedDurationState(minutes)
      setTimeLeft(minutes * 60)
    }
  }

  const incrementTasksCompleted = () => {
    setTasksCompletedThisSession((prev) => prev + 1)
  }

  const startFocus = async (projectTag: string = 'Jarvish_Core_Build') => {
    setIsRunning(true)

    // Backend 1: FastAPI (8008) — stats/session tracking
    try {
      await fetch('http://127.0.0.1:8008/focus/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_tag: projectTag }),
      })
    } catch (error) {
      console.error('Stats backend (8008) failed.', error)
    }

    // Backend 2: Flask (5000) — hosts-file kill switch
    try {
      const response = await fetch('http://127.0.0.1:5000/block')
      const data = await response.json()
      flashMessage(data.status === 'Error' ? `🔴 ${data.message}` : `🟢 ${data.message}`)
    } catch (error) {
      flashMessage('🔴 ERROR: System Controller is Offline!')
    }
  }

  const stopFocus = async () => {
    setIsRunning(false)

    try {
      await fetch('http://127.0.0.1:8008/focus/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks_completed: tasksCompletedThisSession }),
      })
      setTasksCompletedThisSession(0) // reset counter for next session
    } catch (error) {
      console.error('Stats backend (8008) failed during stop.', error)
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/unblock')
      const data = await response.json()
      flashMessage(data.status === 'Error' ? `🔴 ${data.message}` : `🟢 ${data.message}`)
    } catch (error) {
      flashMessage('🔴 ERROR: System Controller is Offline!')
    }
  }

  const resetFocus = async () => {
    if (isRunning) {
      try {
        await fetch('http://127.0.0.1:8008/focus/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks_completed: tasksCompletedThisSession }),
        })
        setTasksCompletedThisSession(0)
      } catch (error) {
        console.error('Stats backend (8008) failed during reset.', error)
      }
      try {
        await fetch('http://127.0.0.1:5000/unblock')
      } catch (error) {
        console.error('Kill Switch backend (5000) failed during reset.', error)
      }
    }
    setIsRunning(false)
    setTimeLeft(selectedDuration * 60)
  }

  return (
    <FocusModeContext.Provider
      value={{
        isRunning,
        timeLeft,
        selectedDuration,
        serverMessage,
        setSelectedDuration,
        startFocus,
        stopFocus,
        resetFocus,
        incrementTasksCompleted,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  const context = useContext(FocusModeContext)
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider')
  }
  return context
}