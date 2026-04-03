import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_INVOICES } from '../lib/mockData'
import { PROJECT_STATUS } from '../lib/constants'

/**
 * Project Store — the shared state that drives cross-role real-time updates.
 *
 * Key behaviour: when a Designer uploads a draft, `updateProjectStatus` is
 * called with 'Review', which immediately changes what the Client sees.
 *
 * In production, replace direct state mutations with API calls + websocket/
 * Supabase real-time subscriptions.
 */
const useProjectStore = create(
  persist(
    (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  projects:    [],
  leads:       [],
  invoices:    MOCK_INVOICES,
  payroll:     [],
  intakeForms:    {},   // { [projectId]: formData }
  todos:          {},   // { [projectId]: [{ id, text, done, createdAt }] }        — client todos
  designerTodos:  {},   // { [designerId]: [{ id, text, done, isPriority, projectId?, createdAt }] }
  projectNotes:    {},   // { [projectId]: [{ id, authorId, authorRole, authorName, text, createdAt }] }
  clientProfiles:  {},   // { [userId]: { avatar, company, phone, ... } }           — cross-role visible profile
  designerProfiles:{},   // { [userId]: { birthday, favFood, funFact, specialty, ... } }
  adminTodos:      [],   // [{ id, text, done, isPriority, createdAt }]             — admin personal to-do list
  projectBriefs:   {},   // { [projectId]: { ...generated brief data, createdAt } } — auto-generated from intake form
  folders:         [],   // [{ id, name, ownerId, ownerRole, ownerName, context, contextId, clientVisible, createdAt, files[] }]
  financials:      { monthlyRevenue: 0, monthlyExpenses: 0, ytdRevenue: 0, ytdExpenses: 0, goalMonthly: 5000, goalYearly: 60000, monthlyBreakdown: [] },
  isLoading:       false,

  // ── Project Actions ────────────────────────────────────────────────────────

  /** Update the status of a project by id */
  updateProjectStatus: (projectId, status) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, status } : p
      ),
    }))
  },

  /** Update progress percentage (0–100) */
  updateProjectProgress: (projectId, progress) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, progress: Math.min(100, Math.max(0, progress)) } : p
      ),
    }))
  },

  /**
   * Designer uploads a draft → auto-transitions project to 'Review'
   * so the client immediately sees the pending feedback request.
   */
  addDraft: (projectId, draft) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          status: PROJECT_STATUS.DRAFT_1,
          drafts: [...(p.drafts ?? []), draft],
        }
      }),
    }))
  },

  /** Add a pinned comment to a draft */
  addDraftComment: (projectId, draftId, comment) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          drafts: p.drafts.map((d) => {
            if (d.id !== draftId) return d
            return { ...d, comments: [...(d.comments ?? []), comment] }
          }),
        }
      }),
    }))
  },

  /** Create a new project */
  createProject: (projectData) => {
    const newProject = {
      id: `proj_${Date.now()}`,
      drafts: [],
      progress: 0,
      ...projectData,
    }
    set((state) => ({ projects: [newProject, ...state.projects] }))
    return newProject
  },

  /** Update any top-level field(s) on a project */
  updateProject: (projectId, patch) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...patch } : p
      ),
    }))
  },

  /** Delete a project by id */
  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    }))
  },

  // ── Intake Form Actions ────────────────────────────────────────────────────

  saveIntakeForm: (projectId, formData) => {
    set((state) => ({
      intakeForms: { ...state.intakeForms, [projectId]: { ...formData, submittedAt: new Date().toISOString() } },
    }))
  },

  getIntakeForm: (projectId) => get().intakeForms[projectId] ?? null,

  // ── Document Note Actions ──────────────────────────────────────────────────

  addDraftNote: (projectId, draftId, note) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          drafts: p.drafts.map((d) => {
            if (d.id !== draftId) return d
            return { ...d, notes: [...(d.notes ?? []), note] }
          }),
        }
      }),
    }))
  },

  // ── Client Todo Actions ────────────────────────────────────────────────────

  addTodo: (projectId, text) => {
    const todo = { id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, text, done: false, createdAt: new Date().toISOString() }
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: [...(state.todos[projectId] ?? []), todo],
      },
    }))
  },

  toggleTodo: (projectId, todoId) => {
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: (state.todos[projectId] ?? []).map((t) =>
          t.id === todoId ? { ...t, done: !t.done } : t
        ),
      },
    }))
  },

  deleteTodo: (projectId, todoId) => {
    set((state) => ({
      todos: {
        ...state.todos,
        [projectId]: (state.todos[projectId] ?? []).filter((t) => t.id !== todoId),
      },
    }))
  },

  // ── Designer Todo Actions ──────────────────────────────────────────────────

  addDesignerTodo: (designerId, text, isPriority = false, projectId = null) => {
    const todo = {
      id: `dtodo_${Date.now()}`,
      text,
      done: false,
      isPriority,
      projectId,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      designerTodos: {
        ...state.designerTodos,
        [designerId]: [...(state.designerTodos[designerId] ?? []), todo],
      },
    }))
  },

  toggleDesignerTodo: (designerId, todoId) => {
    set((state) => ({
      designerTodos: {
        ...state.designerTodos,
        [designerId]: (state.designerTodos[designerId] ?? []).map((t) =>
          t.id === todoId ? { ...t, done: !t.done } : t
        ),
      },
    }))
  },

  deleteDesignerTodo: (designerId, todoId) => {
    set((state) => ({
      designerTodos: {
        ...state.designerTodos,
        [designerId]: (state.designerTodos[designerId] ?? []).filter((t) => t.id !== todoId),
      },
    }))
  },

  setDesignerTodoPriority: (designerId, todoId, isPriority) => {
    set((state) => ({
      designerTodos: {
        ...state.designerTodos,
        [designerId]: (state.designerTodos[designerId] ?? []).map((t) =>
          t.id === todoId ? { ...t, isPriority } : t
        ),
      },
    }))
  },

  // ── Lead Actions ───────────────────────────────────────────────────────────

  addLead: (lead) => {
    const newLead = { id: `lead_${Date.now()}`, ...lead, converted: false }
    set((state) => ({ leads: [newLead, ...state.leads] }))
  },

  updateLead: (leadId, patch) => {
    set((state) => ({
      leads: state.leads.map((l) => (l.id === leadId ? { ...l, ...patch } : l)),
    }))
  },

  deleteLead: (leadId) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== leadId),
    }))
  },

  convertLead: (leadId) => {
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, converted: true, status: 'Converted' } : l
      ),
    }))
  },

  // ── Financials Actions ─────────────────────────────────────────────────────

  setFinancials: (patch) => {
    set((state) => ({ financials: { ...state.financials, ...patch } }))
  },

  // ── Invoice Actions ────────────────────────────────────────────────────────

  addInvoice: (invoice) => {
    const newInvoice = { id: `inv_${Date.now()}`, paidAt: null, ...invoice }
    set((state) => ({ invoices: [newInvoice, ...state.invoices] }))
  },

  markInvoicePaid: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'Paid', paidAt: new Date().toISOString().split('T')[0] }
          : inv
      ),
    }))
  },

  // ── Payroll Actions ────────────────────────────────────────────────────────

  setDesignerPayout: (projectId, designerId, amount) => {
    set((state) => {
      const existing = state.payroll.find(
        (p) => p.projectId === projectId && p.designerId === designerId
      )
      if (existing) {
        return {
          payroll: state.payroll.map((p) =>
            p.projectId === projectId && p.designerId === designerId
              ? { ...p, amount }
              : p
          ),
        }
      }
      return {
        payroll: [
          ...state.payroll,
          {
            id: `pay_${Date.now()}`,
            designerId,
            projectId,
            amount,
            status: 'Pending',
          },
        ],
      }
    })
  },

  // ── Admin Todo Actions ─────────────────────────────────────────────────────

  addAdminTodo: (text, isPriority = false) => {
    const todo = { id: `atodo_${Date.now()}`, text, done: false, isPriority, createdAt: new Date().toISOString() }
    set((state) => ({ adminTodos: [...state.adminTodos, todo] }))
  },

  toggleAdminTodo: (todoId) => {
    set((state) => ({
      adminTodos: state.adminTodos.map((t) => t.id === todoId ? { ...t, done: !t.done } : t),
    }))
  },

  deleteAdminTodo: (todoId) => {
    set((state) => ({ adminTodos: state.adminTodos.filter((t) => t.id !== todoId) }))
  },

  setAdminTodoPriority: (todoId, isPriority) => {
    set((state) => ({
      adminTodos: state.adminTodos.map((t) => t.id === todoId ? { ...t, isPriority } : t),
    }))
  },

  // ── Designer Profile Actions ───────────────────────────────────────────────

  saveDesignerProfile: (userId, profileData) => {
    set((state) => ({
      designerProfiles: {
        ...state.designerProfiles,
        [userId]: { ...(state.designerProfiles[userId] ?? {}), ...profileData },
      },
    }))
  },

  getDesignerProfile: (userId) => get().designerProfiles[userId] ?? null,

  // ── Project Brief Actions ──────────────────────────────────────────────────

  /**
   * Auto-generates a project brief from an intake form submission.
   * Called when client submits their onboarding form.
   * Visible to admin + assigned designer only (not client).
   */
  saveProjectBrief: (projectId, briefData) => {
    set((state) => ({
      projectBriefs: {
        ...state.projectBriefs,
        [projectId]: { ...briefData, updatedAt: new Date().toISOString() },
      },
    }))
  },

  getProjectBrief: (projectId) => get().projectBriefs[projectId] ?? null,

  // ── Folder Actions ─────────────────────────────────────────────────────────

  /**
   * Create a folder.
   * context: 'profile' (client's profile-level) or 'project' (designer's project-level)
   * contextId: userId for profile folders, projectId for project folders
   * clientVisible: designer folders only — controls whether client can see them
   */
  createFolder: (data) => {
    const folder = {
      id:            `folder_${Date.now()}`,
      name:          data.name,
      ownerId:       data.ownerId,
      ownerRole:     data.ownerRole,
      ownerName:     data.ownerName,
      context:       data.context,
      contextId:     data.contextId,
      clientVisible: data.clientVisible ?? true,
      createdAt:     new Date().toISOString(),
      files:         [],
    }
    set((state) => ({ folders: [...state.folders, folder] }))
    return folder
  },

  deleteFolder: (folderId) => {
    set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) }))
  },

  renameFolder: (folderId, name) => {
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
    }))
  },

  setFolderClientVisible: (folderId, clientVisible) => {
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folderId ? { ...f, clientVisible } : f)),
    }))
  },

  addFileToFolder: (folderId, fileName) => {
    const file = { id: `file_${Date.now()}`, name: fileName, uploadedAt: new Date().toISOString() }
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, files: [...f.files, file] } : f
      ),
    }))
  },

  removeFileFromFolder: (folderId, fileId) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, files: f.files.filter((fi) => fi.id !== fileId) } : f
      ),
    }))
  },

  // ── Project Notes Actions (cross-role notes hub) ───────────────────────────

  addProjectNote: (projectId, note) => {
    // note: { id, authorId, authorRole, authorName, text, createdAt }
    set((state) => ({
      projectNotes: {
        ...state.projectNotes,
        [projectId]: [...(state.projectNotes[projectId] ?? []), note],
      },
    }))
  },

  getProjectNotes: (projectId) => get().projectNotes[projectId] ?? [],

  // ── Client Profile Actions ─────────────────────────────────────────────────

  saveClientProfile: (userId, profileData) => {
    set((state) => ({
      clientProfiles: {
        ...state.clientProfiles,
        [userId]: { ...(state.clientProfiles[userId] ?? {}), ...profileData },
      },
    }))
  },

  getClientProfile: (userId) => get().clientProfiles[userId] ?? null,

  // ── Selectors (callable inside components via store) ───────────────────────

  /** Projects visible to a specific designer */
  getDesignerProjects: (designerId) =>
    get().projects.filter((p) => p.designerIds?.includes(designerId)),

  /** The project linked to a specific client */
  getClientProject: (projectId) =>
    get().projects.find((p) => p.id === projectId) ?? null,

  /** All active projects (for admin glance) */
  getActiveProjects: () =>
    get().projects.filter((p) => p.status === PROJECT_STATUS.IN_PROGRESS),

  /** Revenue totals from invoices */
  getRevenueTotals: () => {
    const paid = get().invoices.filter((inv) => inv.status === 'Paid')
    return paid.reduce((sum, inv) => sum + inv.amount, 0)
  },
  }),
    {
      name: 'eml_project_store',
      version: 4,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion < 3) {
          return {
            projects: [], leads: [], invoices: MOCK_INVOICES, payroll: [],
            intakeForms: {}, todos: {}, designerTodos: {}, projectNotes: {},
            clientProfiles: {}, designerProfiles: {}, adminTodos: [],
            projectBriefs: {}, folders: [],
            financials: { monthlyRevenue: 0, monthlyExpenses: 0, ytdRevenue: 0, ytdExpenses: 0, goalMonthly: 5000, goalYearly: 60000, monthlyBreakdown: [] },
          }
        }
        // v3→v4: fix duplicate todo IDs caused by Date.now() in sync loops
        const fixedTodos = {}
        for (const [key, list] of Object.entries(persistedState.todos ?? {})) {
          fixedTodos[key] = (list ?? []).map((t, i) => ({
            ...t,
            id: `todo_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`,
          }))
        }
        return { ...persistedState, todos: fixedTodos }
      },
      partialize: (state) => ({
        projects:        state.projects,
        leads:           state.leads,
        invoices:        state.invoices,
        payroll:         state.payroll,
        intakeForms:     state.intakeForms,
        todos:           state.todos,
        designerTodos:   state.designerTodos,
        projectNotes:    state.projectNotes,
        clientProfiles:  state.clientProfiles,
        designerProfiles:state.designerProfiles,
        adminTodos:      state.adminTodos,
        projectBriefs:   state.projectBriefs,
        folders:         state.folders,
        financials:      state.financials,
      }),
    }
  )
)

export default useProjectStore
