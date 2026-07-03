'use client'

import { useState } from 'react'
import { Check, Plus, Trash2, ChevronDown } from 'lucide-react'

interface Task {
  id: string
  text: string
  completed: boolean
  project: string
  createdAt: Date
}

const PROJECTS = [
  { id: 'ai', label: '[AI]', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-200' },
  { id: 'linux', label: '[Linux]', color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-200' },
  { id: 'study', label: '[Offline Study]', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-200' },
  { id: 'work', label: '[Work]', color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-200' },
]

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      text: 'Complete quarterly roadmap review',
      completed: false,
      project: 'work',
      createdAt: new Date(),
    },
    {
      id: '2',
      text: 'Finalize design system documentation',
      completed: true,
      project: 'ai',
      createdAt: new Date(),
    },
    {
      id: '3',
      text: 'Review team feedback and iterate',
      completed: false,
      project: 'linux',
      createdAt: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [selectedProject, setSelectedProject] = useState('work')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)

  const addTask = () => {
    if (inputValue.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: inputValue,
        completed: false,
        project: selectedProject,
        createdAt: new Date(),
      }
      setTasks([newTask, ...tasks])
      setInputValue('')
    }
  }

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      addTask()
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Today&apos;s Missions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount} of {tasks.length} completed
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex gap-2 mb-6">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="px-3 py-3 rounded-lg border border-border bg-background dark:bg-background hover:bg-muted dark:hover:bg-muted/50 text-foreground flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <span className="text-sm font-medium">
              {PROJECTS.find(p => p.id === selectedProject)?.label}
            </span>
            <ChevronDown size={16} className={`transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showProjectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-card dark:bg-card border border-border rounded-lg shadow-lg z-20">
              {PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProject(proj.id)
                    setShowProjectDropdown(false)
                  }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-muted dark:hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedProject === proj.id ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  {proj.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new mission..."
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-background dark:bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:focus:ring-primary"
        />
        <button
          onClick={addTask}
          className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 text-primary-foreground px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No missions yet. Add one to get started!</p>
          </div>
        ) : (
          tasks.map((task) => {
            const projectInfo = PROJECTS.find(p => p.id === task.project)
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background dark:hover:bg-background/50 transition-colors group"
              >
                {/* Custom Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-primary border-primary dark:bg-primary dark:border-primary'
                      : 'border-border dark:border-border hover:border-primary bg-background dark:bg-background'
                  }`}
                >
                  {task.completed && <Check size={16} className="text-primary-foreground" />}
                </button>

                {/* Project Tag */}
                {projectInfo && (
                  <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-all ${projectInfo.color}`}>
                    {projectInfo.label}
                  </span>
                )}

                {/* Task Text */}
                <span
                  className={`flex-1 transition-all ${
                    task.completed
                      ? 'text-muted-foreground line-through dark:text-muted-foreground'
                      : 'text-foreground dark:text-foreground'
                  }`}
                >
                  {task.text}
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              PROGRESS
            </span>
            <span className="text-xs font-semibold text-primary">
              {Math.round((completedCount / tasks.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
