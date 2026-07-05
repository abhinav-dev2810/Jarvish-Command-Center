'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Plus, Trash2, ChevronDown, Loader2, AlertCircle, Pencil, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Task {
  id: number
  title: string
  is_completed: boolean
  tag: string
  created_at: string
}

const PROJECTS = [
  { id: 'ai', label: '[AI]', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-200' },
  { id: 'linux', label: '[Linux]', color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-200' },
  { id: 'study', label: '[Offline Study]', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-200' },
  { id: 'work', label: '[Work]', color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-200' },
]

type FilterType = 'all' | 'active' | 'completed'

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedProject, setSelectedProject] = useState('work')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  // System Boot: Jaise hi UI khulega, Cloud se data layega
  useEffect(() => {
    fetchTasks()
  }, [])

  // Dropdown ko bahar click karne par band karo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProjectDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Error message ko kuch der baad khud hi hata do
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [errorMsg])

  const fetchTasks = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      setErrorMsg('Tasks load nahi ho paaye. Refresh karke try karo.')
    } else {
      setTasks(data || [])
    }
    setIsLoading(false)
  }

  // Naya Task Cloud me bhejne ka Engine
  const addTask = async () => {
    const title = inputValue.trim()
    if (!title || isAdding) return

    setIsAdding(true)
    const newTask = {
      title,
      tag: selectedProject,
      is_completed: false,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()

    if (error) {
      console.error('Error adding task:', error)
      setErrorMsg('Task add nahi ho paaya. Dobara try karo.')
    } else if (data) {
      setTasks((prev) => [data[0], ...prev])
      setInputValue('')
    }
    setIsAdding(false)
  }

  // Task Complete karne ka function (with rollback on failure)
  const toggleTask = async (id: number, currentStatus: boolean) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, is_completed: !currentStatus } : task))
    )

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating task:', error)
      setErrorMsg('Status update nahi ho paaya.')
      // Rollback
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, is_completed: currentStatus } : task))
      )
    }
  }

  // Task Delete karne ka function (with rollback on failure)
  const deleteTask = async (id: number) => {
    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== id))

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      setErrorMsg('Task delete nahi ho paaya.')
      // Rollback
      setTasks(previousTasks)
    }
  }

  // Task edit karne ka naya function
  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditValue(task.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = async (id: number) => {
    const newTitle = editValue.trim()
    if (!newTitle) {
      cancelEditing()
      return
    }

    const previousTasks = tasks
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, title: newTitle } : task)))
    setEditingId(null)

    const { error } = await supabase
      .from('tasks')
      .update({ title: newTitle })
      .eq('id', id)

    if (error) {
      console.error('Error editing task:', error)
      setErrorMsg('Task edit nahi ho paaya.')
      setTasks(previousTasks)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      addTask()
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: number) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const completedCount = tasks.filter((t) => t.is_completed).length

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.is_completed
    if (filter === 'completed') return task.is_completed
    return true
  })

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

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Section */}
      <div className="flex gap-2 mb-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="px-3 py-3 rounded-lg border border-border bg-background dark:bg-background hover:bg-muted dark:hover:bg-muted/50 text-foreground flex items-center gap-2 transition-all whitespace-nowrap"
            aria-haspopup="listbox"
            aria-expanded={showProjectDropdown}
          >
            <span className="text-sm font-medium">
              {PROJECTS.find((p) => p.id === selectedProject)?.label}
            </span>
            <ChevronDown size={16} className={`transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showProjectDropdown && (
            <div
              role="listbox"
              className="absolute top-full left-0 mt-1 w-36 bg-card dark:bg-card border border-border rounded-lg shadow-lg z-20"
            >
              {PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  role="option"
                  aria-selected={selectedProject === proj.id}
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
          onKeyDown={handleKeyDown}
          placeholder="Add a new mission..."
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-background dark:bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:focus:ring-primary"
        />
        <button
          onClick={addTask}
          disabled={!inputValue.trim() || isAdding}
          className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
        >
          {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Filter Tabs */}
      {tasks.length > 0 && (
        <div className="flex gap-1 mb-4 p-1 bg-background dark:bg-background rounded-lg w-fit">
          {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span>Loading missions...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {tasks.length === 0 ? 'No missions yet. Add one to get started!' : 'No tasks match this filter.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const projectInfo = PROJECTS.find((p) => p.id === task.tag)
            const isEditing = editingId === task.id
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background dark:hover:bg-background/50 transition-colors group"
              >
                {/* Custom Checkbox */}
                <button
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    task.is_completed
                      ? 'bg-primary border-primary dark:bg-primary dark:border-primary'
                      : 'border-border dark:border-border hover:border-primary bg-background dark:bg-background'
                  }`}
                >
                  {task.is_completed && <Check size={16} className="text-primary-foreground" />}
                </button>

                {/* Project Tag */}
                {projectInfo && (
                  <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-all ${projectInfo.color}`}>
                    {projectInfo.label}
                  </span>
                )}

                {/* Task Text or Edit Input */}
                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                    onBlur={() => saveEdit(task.id)}
                    className="flex-1 px-2 py-1 rounded border border-primary bg-background text-foreground focus:outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => startEditing(task)}
                    className={`flex-1 transition-all cursor-text ${
                      task.is_completed
                        ? 'text-muted-foreground line-through dark:text-muted-foreground'
                        : 'text-foreground dark:text-foreground'
                    }`}
                  >
                    {task.title}
                  </span>
                )}

                {/* Edit / Delete Buttons */}
                {isEditing ? (
                  <button
                    onClick={cancelEditing}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1"
                    aria-label="Cancel edit"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => startEditing(task)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1"
                    aria-label="Edit task"
                  >
                    <Pencil size={16} />
                  </button>
                )}
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
            <span className="text-xs font-semibold text-muted-foreground">PROGRESS</span>
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
