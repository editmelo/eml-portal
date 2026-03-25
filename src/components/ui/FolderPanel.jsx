import { useState } from 'react'
import { Folder, FolderOpen, Plus, Trash2, Edit2, Eye, EyeOff, FileText, X, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatDate } from '../../lib/utils'

/**
 * FolderPanel — reusable folder/file organizer embedded in project and profile views.
 *
 * Props:
 *   folders           FolderItem[]   Folders to display
 *   onCreateFolder    (name) => void   If provided, shows "New Folder" button
 *   onDeleteFolder    (folderId) => void
 *   onRenameFolder    (folderId, name) => void
 *   onToggleVisible   (folderId, visible) => void  — shows eye toggle (designer folders only)
 *   onAddFile         (folderId, fileName) => void
 *   onRemoveFile      (folderId, fileId) => void
 *   isAdmin           boolean  — uses admin token colours instead of portal colours
 *   isDark            boolean  — admin dark mode flag (only matters when isAdmin=true)
 *   emptyMessage      string
 */
export default function FolderPanel({
  folders = [],
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onToggleVisible,
  onAddFile,
  onRemoveFile,
  isAdmin = false,
  isDark = false,
  emptyMessage = 'No folders yet.',
}) {
  const [expanded,      setExpanded]      = useState({})  // { [folderId]: boolean }
  const [renamingId,    setRenamingId]    = useState(null)
  const [renameText,    setRenameText]    = useState('')
  const [creatingNew,   setCreatingNew]   = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addingFileId,  setAddingFileId]  = useState(null)
  const [newFileName,   setNewFileName]   = useState('')

  // ── Colour helpers ──────────────────────────────────────────────────────────

  // Container / surface
  const surface = isAdmin
    ? (isDark ? 'bg-admin-bg border-admin-border' : 'bg-white border-slate-200')
    : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700'

  // Text colours
  const textPrimary = isAdmin
    ? (isDark ? 'text-slate-200' : 'text-slate-800')
    : 'text-slate-800 dark:text-slate-200'

  const textSecondary = isAdmin
    ? (isDark ? 'text-slate-500' : 'text-slate-500')
    : 'text-slate-500 dark:text-slate-400'

  // Input style
  const inputCls = isAdmin
    ? (isDark
        ? 'bg-admin-bg border border-admin-border text-slate-200 placeholder-slate-600 focus:ring-brand-400/30'
        : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-brand-500/20')
    : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:ring-brand-500/20'

  // ── Handlers ───────────────────────────────────────────────────────────────

  const submitCreate = () => {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim())
    setNewFolderName('')
    setCreatingNew(false)
  }

  const submitRename = (folderId) => {
    if (!renameText.trim()) return
    onRenameFolder(folderId, renameText.trim())
    setRenamingId(null)
  }

  const submitAddFile = (folderId) => {
    if (!newFileName.trim()) return
    onAddFile(folderId, newFileName.trim())
    setNewFileName('')
    setAddingFileId(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">

      {/* New Folder button */}
      {onCreateFolder && !creatingNew && (
        <button
          onClick={() => setCreatingNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-medium transition-colors
            border-brand-500/40 text-brand-500 hover:bg-brand-500/5"
        >
          <Plus size={12} /> New Folder
        </button>
      )}

      {/* Inline new folder input */}
      {creatingNew && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className={cn('flex-1 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2', inputCls)}
            placeholder="Folder name…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate()
              if (e.key === 'Escape') setCreatingNew(false)
            }}
          />
          <button onClick={submitCreate} className="text-emerald-500 hover:text-emerald-600">
            <Check size={15} />
          </button>
          <button onClick={() => setCreatingNew(false)} className="text-slate-400 hover:text-slate-500">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {folders.length === 0 && !creatingNew && (
        <p className={cn('text-xs py-4 text-center', textSecondary)}>{emptyMessage}</p>
      )}

      {/* Folder list */}
      {folders.map((folder) => {
        const isOpen      = expanded[folder.id] ?? false
        const isRenaming  = renamingId === folder.id
        const isAddingFile = addingFileId === folder.id

        return (
          <div
            key={folder.id}
            className={cn('rounded-xl border overflow-hidden', surface)}
          >
            {/* Folder header row */}
            <div className="flex items-center gap-2 px-3 py-2.5">

              {/* Expand toggle + icon */}
              <button
                onClick={() => setExpanded((p) => ({ ...p, [folder.id]: !isOpen }))}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                {isOpen
                  ? <FolderOpen size={15} className="text-brand-500 shrink-0" />
                  : <Folder     size={15} className="text-brand-500 shrink-0" />
                }

                {isRenaming ? (
                  <input
                    autoFocus
                    className={cn('flex-1 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-2', inputCls)}
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename(folder.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={cn('text-xs font-semibold truncate', textPrimary)}>
                    {folder.name}
                  </span>
                )}

                <span className={cn('text-[10px] shrink-0', textSecondary)}>
                  {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>

                {/* Visibility toggle (designer folders) */}
                {onToggleVisible && (
                  <button
                    title={folder.clientVisible ? 'Hide from client' : 'Show to client'}
                    onClick={() => onToggleVisible(folder.id, !folder.clientVisible)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      folder.clientVisible
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : 'text-slate-400 hover:text-slate-500'
                    )}
                  >
                    {folder.clientVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                )}

                {/* Rename */}
                {onRenameFolder && !isRenaming && (
                  <button
                    title="Rename"
                    onClick={() => { setRenamingId(folder.id); setRenameText(folder.name) }}
                    className={cn('p-1 rounded transition-colors', textSecondary, 'hover:text-brand-500')}
                  >
                    <Edit2 size={12} />
                  </button>
                )}

                {isRenaming && (
                  <>
                    <button onClick={() => submitRename(folder.id)} className="text-emerald-500 hover:text-emerald-600 p-1">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-500 p-1">
                      <X size={13} />
                    </button>
                  </>
                )}

                {/* Delete */}
                {onDeleteFolder && (
                  <button
                    title="Delete folder"
                    onClick={() => onDeleteFolder(folder.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Folder body (expanded) */}
            {isOpen && (
              <div className={cn(
                'border-t px-4 py-3 space-y-2',
                isAdmin
                  ? (isDark ? 'border-admin-border' : 'border-slate-200')
                  : 'border-slate-100 dark:border-slate-700'
              )}>

                {folder.files.length === 0 && !isAddingFile && (
                  <p className={cn('text-[11px] italic', textSecondary)}>Empty folder.</p>
                )}

                {/* File list */}
                {folder.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 group">
                    <FileText size={12} className="text-slate-400 shrink-0" />
                    <span className={cn('text-xs flex-1 truncate', textPrimary)}>{file.name}</span>
                    <span className={cn('text-[10px] shrink-0', textSecondary)}>
                      {formatDate(file.uploadedAt?.split('T')[0])}
                    </span>
                    {onRemoveFile && (
                      <button
                        onClick={() => onRemoveFile(folder.id, file.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add file input */}
                {isAddingFile ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      className={cn('flex-1 rounded px-2 py-1 text-[11px] outline-none focus:ring-2', inputCls)}
                      placeholder="File name…"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitAddFile(folder.id)
                        if (e.key === 'Escape') setAddingFileId(null)
                      }}
                    />
                    <button onClick={() => submitAddFile(folder.id)} className="text-emerald-500 hover:text-emerald-600">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setAddingFileId(null)} className="text-slate-400">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  onAddFile && (
                    <button
                      onClick={() => setAddingFileId(folder.id)}
                      className="flex items-center gap-1 text-[11px] text-brand-500 hover:underline mt-1"
                    >
                      <Plus size={11} /> Add file
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
