import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useTodos — Supabase-backed todo hook for all roles.
 *
 * @param {string} ownerId — the user's id
 * @param {string|null} projectId — optional project scope (for client todos)
 * @returns {{ todos, loading, addTodo, toggleTodo, deleteTodo, setPriority }}
 */
export default function useTodos(ownerId, projectId = null) {
  const [todos, setTodos]     = useState([])
  const [loading, setLoading] = useState(true)

  // ── Load todos from Supabase ─────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!ownerId) return
    setLoading(true)
    let query = supabase
      .from('todos')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    } else {
      query = query.is('project_id', null)
    }

    const { data, error } = await query
    if (error) {
      console.error('useTodos load error:', error.message)
      // Fall back gracefully — keep whatever is in state
    } else {
      setTodos((data ?? []).map((r) => ({
        id:         r.id,
        text:       r.text,
        done:       r.done,
        isPriority: r.is_priority,
        projectId:  r.project_id,
        createdAt:  r.created_at,
      })))
    }
    setLoading(false)
  }, [ownerId, projectId])

  useEffect(() => { load() }, [load])

  // ── Add ──────────────────────────────────────────────────────────────────
  const addTodo = async (text, isPriority = false) => {
    const id = `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const newTodo = { id, text, done: false, isPriority, projectId, createdAt: new Date().toISOString() }

    // Optimistic local update
    setTodos((prev) => [...prev, newTodo])

    const { error } = await supabase.from('todos').insert({
      id,
      owner_id:    ownerId,
      project_id:  projectId,
      text,
      done:        false,
      is_priority: isPriority,
    })
    if (error) console.error('addTodo error:', error.message)
  }

  // ── Toggle ───────────────────────────────────────────────────────────────
  const toggleTodo = async (todoId) => {
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return
    const newDone = !todo.done

    setTodos((prev) => prev.map((t) => t.id === todoId ? { ...t, done: newDone } : t))

    const { error } = await supabase.from('todos').update({ done: newDone }).eq('id', todoId)
    if (error) console.error('toggleTodo error:', error.message)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteTodo = async (todoId) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId))

    const { error } = await supabase.from('todos').delete().eq('id', todoId)
    if (error) console.error('deleteTodo error:', error.message)
  }

  // ── Set priority ─────────────────────────────────────────────────────────
  const setPriority = async (todoId, isPriority) => {
    setTodos((prev) => prev.map((t) => t.id === todoId ? { ...t, isPriority } : t))

    const { error } = await supabase.from('todos').update({ is_priority: isPriority }).eq('id', todoId)
    if (error) console.error('setPriority error:', error.message)
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo, setPriority, reload: load }
}
