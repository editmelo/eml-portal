import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { Upload, FileImage, X, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function DesignerUpload() {
  const user       = useAuthStore(selectUser)
  const projects   = useProjectStore((s) => s.projects)
  const addDraft   = useProjectStore((s) => s.addDraft)

  const myProjects = projects.filter((p) => p.designerIds?.includes(user?.id))

  const [selectedProject, setSelectedProject] = useState(myProjects[0]?.id ?? '')
  const [label,           setLabel]           = useState('')
  const [files,           setFiles]           = useState([])
  const [uploaded,        setUploaded]        = useState(false)

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    multiple: true,
  })

  const removeFile = (idx) => setFiles((f) => f.filter((_, i) => i !== idx))

  const handleSubmit = () => {
    if (!selectedProject || files.length === 0) {
      toast.error('Select a project and add at least one file.')
      return
    }

    // In production, upload files to cloud storage and get back URLs.
    // Here we use a placeholder image to simulate the upload.
    files.forEach((file) => {
      addDraft(selectedProject, {
        id:          `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        url:         URL.createObjectURL(file),
        label:       label || file.name,
        uploadedAt:  new Date().toISOString().split('T')[0],
        designerId:  user.id,
        comments:    [],
      })
    })

    toast.success('Drafts uploaded! Client status updated to Review.')
    setFiles([])
    setLabel('')
    setUploaded(true)
  }

  if (uploaded) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center min-h-96 text-center">
          <CheckCircle2 size={56} className="text-emerald-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Drafts Submitted!</h2>
          <p className="text-slate-500 max-w-sm">
            Your files are uploaded. The client has been notified and the project status is now "Review."
          </p>
          <Button className="mt-6" onClick={() => setUploaded(false)}>Upload More</Button>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <PageHeader title="Upload Drafts" subtitle="Drop your design files below. The client will be notified automatically." className="mb-8" />

      <div className="max-w-xl space-y-5">
        {/* Project selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Project</label>
          <select
            className="input-base"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select project…</option>
            {myProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Draft Label</label>
          <input
            className="input-base"
            placeholder="e.g. Logo Concept v2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-brand-400 bg-blue-50 dark:bg-brand-500/10'
              : 'border-slate-200 dark:border-slate-600 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={32} className={cn('mx-auto mb-3', isDragActive ? 'text-brand-400' : 'text-slate-300')} />
          <p className="text-sm text-slate-500">
            {isDragActive ? 'Drop files here…' : 'Drag & drop or click to select files'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF, AI, EPS</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                <FileImage size={16} className="text-brand-500 shrink-0" />
                <p className="text-sm text-slate-700 flex-1 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full"
          icon={<Upload size={15} />}
          onClick={handleSubmit}
          disabled={!selectedProject || files.length === 0}
        >
          Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Drafts'}
        </Button>
      </div>
    </PortalLayout>
  )
}
