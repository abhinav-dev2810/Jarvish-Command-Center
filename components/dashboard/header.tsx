'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="border-b border-border dark:border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            Jarvish Command Center
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/60 text-foreground transition-all duration-200 hover:shadow-sm active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-foreground" />
              ) : (
                <Sun size={20} className="text-foreground" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 dark:bg-muted">
            <span className="text-sm font-medium text-foreground">
              Friday · Online
            </span>
            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
            <style>{`
              @keyframes subtle-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              .animate-pulse {
                animation: subtle-pulse 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes accent-line {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .border-b {
          position: relative;
        }
        .border-b::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--primary), transparent);
          opacity: 0;
          animation: accent-line 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
