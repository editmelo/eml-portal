import { useState, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { CheckCircle2, Circle, Trash2, Plus, Flag } from 'lucide-react'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminTodo() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const adminTodos         = useProjectStore((s) => s.adminTodos)
  const addAdminTodo       = useProjectStore((s) => s.addAdminTodo)
  const toggleAdminTodo    = useProjectStore((s) => s.toggleAdminTodo)
  const deleteAdminTodo    = useProjectStore((s) => s.deleteAdminTodo)
  const setAdminTodoPriority = useProjectStore((s) => s.setAdminTodoPriority)

  const [newText,    setNewText]    = useState('')
  const [isPriority, setIsPriority] = useState(false)
  const [filter,     setFilter]     = useState('all') // all | priority | done
  const inputRef = useRef(null)

  const done = adminTodos.filter((t) => t.done).length
  const pct  = adminTodos.length > 0 ? Math.round((done / adminTodos.length) * 100) : 0

  const filtered = adminTodos.filter((t) => {
    if (filter === 'priority') return t.isPriority && !t.done
    if (filter === 'done')     return t.done
    return true
  })

  const pending   = filtered.filter((t) => !t.done)
  const completed = filtered.filter((t) => t.done)

  const handleAdd = () => {
    if (!newText.trim()) {
      toast.error('Please type a task first.')
      inputRef.current?.focus()
      return
    }
    addAdminTodo(newText.trim(), isPriority)
    toast.success(isPriority ? 'Priority task added!' : 'Task added!')
    setNewText('')
    setIsPriority(false)
    inputRef.current?.focus()
  }

  const handleDelete = (id) => {
    deleteAdminTodo(id)
    toast.success('Removed')
  }

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="To-Do"
        subtitle="Your personal business task list."
        className="mb-8"
      />

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{done} of {adminTodos.length} completed</span>
          <span className="font-semibold text-slate-200">{pct}%</span>
        </div>
        <div className="h-2 bg-admin-bg rounded-full overflow-hidden border border-admin-border">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-admin-surface border border-admin-border rounded-lg w-fit mb-6">
        {[
          { id: 'all',      label: 'All' },
          { id: 'priority', label: '🚩 Priority' },
          { id: 'done',     label: 'Done' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DarkCard>
        {/* Add new item */}
        <div className="px-5 pt-5 pb-4 border-b border-admin-border space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-lg border border-admin-border bg-admin-bg text-slate-200 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              placeholder="Add a new task…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shrink-0"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsPriority((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              isPriority
                ? 'bg-red-500/10 text-red-400 border-red-400/30'
                : 'bg-admin-bg text-slate-500 border-admin-border hover:border-red-400/30 hover:text-red-400'
            )}
          >
            <Flag size={11} />
            {isPriority ? 'Priority — will be flagged' : 'Mark as priority'}
          </button>
        </div>

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">To Do</p>
            <ul className="space-y-1">
              {pending.map((todo) => (
                <li key={todo.id} className="group flex items-start gap-3 py-2.5 border-b border-admin-border/40 last:border-0">
                  <button
                    onClick={() => toggleAdminTodo(todo.id)}
                    className="mt-0.5 shrink-0 text-slate-600 hover:text-brand-400 transition-colors"
                  >
                    <Circle size={18} />
                  </button>
                  <span className="flex-1 text-sm text-slate-300 leading-relaxed">{todo.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => setAdminTodoPriority(todo.id, !todo.isPriority)}
                      title={todo.isPriority ? 'Remove priority' : 'Mark priority'}
                      className={cn(
                        'transition-colors',
                        todo.isPriority ? 'text-red-400' : 'text-slate-600 hover:text-red-400'
                      )}
                    >
                      <Flag size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completed items */}
        {completed.length > 0 && (
          <div className="px-5 pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Completed</p>
            <ul className="space-y-1">
              {completed.map((todo) => (
                <li key={todo.id} className="group flex items-start gap-3 py-2.5 border-b border-admin-border/40 last:border-0">
                  <button
                    onClick={() => toggleAdminTodo(todo.id)}
                    className="mt-0.5 shrink-0 text-emerald-500 hover:text-slate-500 transition-colors"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <span className="flex-1 text-sm text-slate-600 line-through leading-relaxed">{todo.text}</span>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">
              {filter === 'all' ? 'No tasks yet. Add one above!' :
               filter === 'priority' ? 'No priority tasks. Flag tasks with 🚩 to show them here.' :
               'No completed tasks yet.'}
            </p>
          </div>
        )}
      </DarkCard>
    </AdminLayout>
  )
}
