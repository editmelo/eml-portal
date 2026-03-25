import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

// Default to-dos every client should complete
const DEFAULT_TODOS = [
  'Complete your client intake form (Onboarding tab)',
  'Review and sign your Service Agreement (Agreements tab)',
  'Upload any existing brand assets or inspiration files',
  'Book your kickoff call (Schedule tab)',
  'Review initial draft concepts once uploaded',
  'Provide written feedback on drafts within the agreed timeline',
  'Confirm final deliverables and approve for production',
  'Settle outstanding invoices before final file delivery',
]

export default function ClientTodo() {
  const user      = useAuthStore(selectUser)
  const projects  = useProjectStore((s) => s.projects)
  const todos     = useProjectStore((s) => s.todos)
  const addTodo   = useProjectStore((s) => s.addTodo)
  const toggleTodo = useProjectStore((s) => s.toggleTodo)
  const deleteTodo = useProjectStore((s) => s.deleteTodo)

  const project   = projects.find((p) => p.id === user?.projectId)
  const projectId = project?.id ?? `guest_${user?.id}`

  const [newText, setNewText] = useState('')
  const [seeded,  setSeeded]  = useState(false)

  // Seed defaults on first visit if no todos exist
  if (!seeded && (!todos[projectId] || todos[projectId].length === 0)) {
    setSeeded(true)
    DEFAULT_TODOS.forEach((text) => addTodo(projectId, text))
  }

  const list     = todos[projectId] ?? []
  const done     = list.filter((t) => t.done).length
  const pct      = list.length > 0 ? Math.round((done / list.length) * 100) : 0

  const handleAdd = () => {
    if (!newText.trim()) return
    addTodo(projectId, newText.trim())
    setNewText('')
  }

  const handleToggle = (id) => toggleTodo(projectId, id)
  const handleDelete = (id) => {
    deleteTodo(projectId, id)
    toast.success('Item removed')
  }

  return (
    <PortalLayout>
      <PageHeader
        title="Client To-Do"
        subtitle="Complete these items to keep your project moving forward."
        className="mb-8"
      />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>{done} of {list.length} completed</span>
          <span className="font-semibold text-slate-800">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Card>
        {/* Add new item */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Add a new to-do item…"
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
        </div>

        {/* Pending items */}
        <div>
          {list.filter((t) => !t.done).length > 0 && (
            <div className="px-5 pt-4 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">To Do</p>
              <ul className="space-y-1">
                {list.filter((t) => !t.done).map((todo) => (
                  <li key={todo.id} className="group flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => handleToggle(todo.id)}
                      className="mt-0.5 shrink-0 text-slate-300 hover:text-brand-500 transition-colors"
                    >
                      <Circle size={18} />
                    </button>
                    <span className="flex-1 text-sm text-slate-700 leading-relaxed">{todo.text}</span>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completed items */}
          {list.filter((t) => t.done).length > 0 && (
            <div className="px-5 pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Completed</p>
              <ul className="space-y-1">
                {list.filter((t) => t.done).map((todo) => (
                  <li key={todo.id} className="group flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => handleToggle(todo.id)}
                      className="mt-0.5 shrink-0 text-emerald-500 hover:text-slate-300 transition-colors"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <span className="flex-1 text-sm text-slate-400 line-through leading-relaxed">{todo.text}</span>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {list.length === 0 && (
            <CardBody className="text-center py-10">
              <p className="text-slate-400 text-sm">No items yet. Add something above!</p>
            </CardBody>
          )}
        </div>
      </Card>
    </PortalLayout>
  )
}
