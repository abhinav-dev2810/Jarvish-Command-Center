'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react'

interface FeedItem {
  id: string
  icon: React.ReactNode
  message: string
  timestamp: string
  type: 'success' | 'warning' | 'info' | 'milestone'
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: '1',
    icon: <CheckCircle2 className="size-4 text-primary" />,
    message: 'Deep work session completed: 45 minutes',
    timestamp: '2m ago',
    type: 'success',
  },
  {
    id: '2',
    icon: <Zap className="size-4 text-primary" />,
    message: 'Streak extended to 18 days',
    timestamp: '15m ago',
    type: 'milestone',
  },
  {
    id: '3',
    icon: <MessageSquare className="size-4 text-primary" />,
    message: '3 new messages while in focus mode',
    timestamp: '28m ago',
    type: 'info',
  },
  {
    id: '4',
    icon: <BarChart3 className="size-4 text-primary" />,
    message: 'Weekly productivity report ready',
    timestamp: '1h ago',
    type: 'info',
  },
  {
    id: '5',
    icon: <Clock className="size-4 text-primary" />,
    message: 'Focus time goal: 6.5h (current: 5.2h)',
    timestamp: '2h ago',
    type: 'warning',
  },
  {
    id: '6',
    icon: <AlertCircle className="size-4 text-primary" />,
    message: 'System update available',
    timestamp: '3h ago',
    type: 'info',
  },
]

export function FridayFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(INITIAL_FEED)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!autoScroll) return

    const interval = setInterval(() => {
      // Simulate new feed items
      if (Math.random() > 0.6) {
        const newItem: FeedItem = {
          id: Date.now().toString(),
          icon: <CheckCircle2 className="size-4 text-primary" />,
          message: 'Action completed successfully',
          timestamp: 'now',
          type: 'success',
        }
        setFeedItems((prev) => [newItem, ...prev.slice(0, -1)])
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [autoScroll])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Friday&apos;s Feed</h2>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
            autoScroll
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground bg-muted/30'
          }`}
        >
          {autoScroll ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Feed items container */}
      <div className="flex-1 overflow-y-auto space-y-0">
        {feedItems.map((item, index) => (
          <div key={item.id}>
            <div className="py-3 px-3 hover:bg-muted/30 transition-colors duration-150 flex gap-3 group">
              <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-5 group-hover:text-foreground/90">
                  {item.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.timestamp}
                </p>
              </div>
            </div>
            {index < feedItems.length - 1 && (
              <div className="h-px bg-border/50" />
            )}
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <style>{`
        @keyframes scroll-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
