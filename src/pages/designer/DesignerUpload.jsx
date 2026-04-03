import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { Upload, FileImage, X, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { logActivity } from '../../store/activityStore'
import toast from 'react-hot-toast'

// ── Draft type configuration ────────────────────────────────────────────────
const DRAFT_TYPES = [
  { key: 'brand_identity',     label: 'Brand Identity',     desc: 'Upload design files' },
  { key: 'website',            label: 'Website Design',     desc: 'Share a link' },
  { key: 'social_management',  label: 'Social Management',  desc: 'Social & marketing content' },
  { key: 'creative_on_demand', label: 'Creative On-Demand', desc: 'Flyers, menus, merch & more' },
]

const SM_PILLARS = [
  'Essential Coverage',
  'Daily Presence',
  'Strategic Growth',
  'Premium Authority',
]

const SM_CATEGORIES = [
  'Social Media Content',
  'Social Media Strategy',
  'Marketing Strategy',
  'Analytics Reports',
  'Ad Content',
  'Campaign Content',
]

const COD_CATEGORIES = [
  'Flyers',
  'Menu',
  'Social Content',
  'Apparel & Merch Design — Essential',
  'Apparel & Merch Design — Premium',
  'Apparel & Merch Design — Full Buyout',
]

export default function DesignerUpload() {
  const user       = useAuthStore(selectUser)
  const projects   = useProjectStore((s) => s.projects)
  const addDraft   = useProjectStore((s) => s.addDraft)

  const myProjects = projects.filter((p) => p.designerIds?.includes(user?.id))

  const [selectedProject,  setSelectedProject]  = useState(myProjects[0]?.id ?? '')
  const [draftType,        setDraftType]        = useState('brand_identity')
  const [label,            setLabel]            = useState('')
  const [websiteUrl,       setWebsiteUrl]       = useState('')
  const [files,            setFiles]            = useState([])
  const [contentCategory,  setContentCategory]  = useState('')
  const [pillar,           setPillar]           = useState('')
  const [uploaded,         setUploaded]         = useState(false)

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    multiple: true,
  })

  const removeFile = (idx) => setFiles((f) => f.filter((_, i) => i !== idx))

  const handleTypeChange = (key) => {
    setDraftType(key)
    setContentCategory('')
    setPillar('')
    setFiles([])
    setWebsiteUrl('')
    setLabel('')
  }

  const canSubmit = () => {
    if (!selectedProject) return false
    if (draftType === 'website') return !!websiteUrl.trim()
    if (draftType === 'social_management') return contentCategory && pillar && files.length > 0
    if (draftType === 'creative_on_demand') return contentCategory && files.length > 0
    return files.length > 0
  }

  const handleSubmit = () => {
    if (!selectedProject) {
      toast.error('Please select a project.')
      return
    }

    const projectName = myProjects.find((p) => p.id === selectedProject)?.name ?? 'project'
    const makeId = () => `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const today  = new Date().toISOString().split('T')[0]

    if (draftType === 'website') {
      if (!websiteUrl.trim()) { toast.error('Please enter the website URL.'); return }
      addDraft(selectedProject, {
        id: makeId(), url: websiteUrl.trim(), label: label || 'Website Design',
        draftType: 'website', uploadedAt: today, designerId: user.id, comments: [],
      })
      logActivity({ actorId: user.id, actorName: user.name, actorRole: user.role, action: 'draft_uploaded',
        description: `shared a website design link for "${projectName}"`, projectId: selectedProject })
      toast.success('Website link shared! Client status updated to Review.')

    } else if (draftType === 'social_management') {
      if (!contentCategory) { toast.error('Please select a content type.'); return }
      if (!pillar) { toast.error('Please select a pillar.'); return }
      if (files.length === 0) { toast.error('Add at least one file.'); return }
      files.forEach((file) => {
        addDraft(selectedProject, {
          id: makeId(), url: URL.createObjectURL(file),
          label: label || `${contentCategory} — ${pillar}`,
          draftType: 'social_management', contentCategory, pillar,
          uploadedAt: today, designerId: user.id, comments: [],
        })
      })
      logActivity({ actorId: user.id, actorName: user.name, actorRole: user.role, action: 'draft_uploaded',
        description: `uploaded ${files.length} ${contentCategory.toLowerCase()} file${files.length > 1 ? 's' : ''} (${pillar}) for "${projectName}"`,
        projectId: selectedProject })
      toast.success('Social management content uploaded! Client notified.')

    } else if (draftType === 'creative_on_demand') {
      if (!contentCategory) { toast.error('Please select a content type.'); return }
      if (files.length === 0) { toast.error('Add at least one file.'); return }
      files.forEach((file) => {
        addDraft(selectedProject, {
          id: makeId(), url: URL.createObjectURL(file),
          label: label || contentCategory,
          draftType: 'creative_on_demand', contentCategory,
          uploadedAt: today, designerId: user.id, comments: [],
        })
      })
      logActivity({ actorId: user.id, actorName: user.name, actorRole: user.role, action: 'draft_uploaded',
        description: `uploaded ${files.length} ${contentCategory.toLowerCase()} file${files.length > 1 ? 's' : ''} for "${projectName}"`,
        projectId: selectedProject })
      toast.success('Creative on-demand content uploaded! Client notified.')

    } else {
      // brand_identity
      if (files.length === 0) { toast.error('Add at least one file.'); return }
      files.forEach((file) => {
        addDraft(selectedProject, {
          id: makeId(), url: URL.createObjectURL(file),
          label: label || file.name, draftType: 'brand_identity',
          uploadedAt: today, designerId: user.id, comments: [],
        })
      })
      logActivity({ actorId: user.id, actorName: user.name, actorRole: user.role, action: 'draft_uploaded',
        description: `uploaded ${files.length} brand identity draft${files.length > 1 ? 's' : ''} for "${projectName}"`,
        projectId: selectedProject })
      toast.success('Drafts uploaded! Client status updated to Review.')
    }

    setFiles([])
    setLabel('')
    setWebsiteUrl('')
    setContentCategory('')
    setPillar('')
    setUploaded(true)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
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

  const labelPlaceholder = {
    brand_identity:     'e.g. Logo Concept v2',
    website:            'e.g. Homepage v2',
    social_management:  'e.g. April Social Package',
    creative_on_demand: 'e.g. Grand Opening Flyer',
  }[draftType]

  const submitLabel = draftType === 'website'
    ? 'Share Website Link'
    : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Drafts'}`

  return (
    <PortalLayout>
      <PageHeader title="Upload Drafts" subtitle="Drop your design files below. The client will be notified automatically." className="mb-8" />

      <div className="max-w-xl space-y-5">
        {/* Project selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Project</label>
          <select className="input-base" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
            <option value="">Select project…</option>
            {myProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Draft type selector — 2×2 grid */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Draft Type</label>
          <div className="grid grid-cols-2 gap-2">
            {DRAFT_TYPES.map(({ key, label: lbl, desc }) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={cn(
                  'rounded-xl border-2 p-3 text-left transition-all',
                  draftType === key
                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                )}
              >
                <p className={cn('text-sm font-semibold', draftType === key ? 'text-brand-500' : 'text-slate-700 dark:text-slate-300')}>
                  {lbl}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Social Management — pillar selector */}
        {draftType === 'social_management' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Pillar</label>
            <select className="input-base" value={pillar} onChange={(e) => setPillar(e.target.value)}>
              <option value="">Select pillar…</option>
              {SM_PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Social Management — content category */}
        {draftType === 'social_management' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Content Type</label>
            <select className="input-base" value={contentCategory} onChange={(e) => setContentCategory(e.target.value)}>
              <option value="">Select content type…</option>
              {SM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Creative On-Demand — content category */}
        {draftType === 'creative_on_demand' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Content Type</label>
            <select className="input-base" value={contentCategory} onChange={(e) => setContentCategory(e.target.value)}>
              <option value="">Select content type…</option>
              {COD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Draft Label</label>
          <input
            className="input-base"
            placeholder={labelPlaceholder}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Website URL input */}
        {draftType === 'website' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Website URL</label>
            <input
              className="input-base"
              type="url"
              placeholder="https://preview.example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">Paste the link to the design preview or staging site</p>
          </div>
        )}

        {/* Dropzone (all types except website) */}
        {draftType !== 'website' && (
          <>
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

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5 border border-slate-200 dark:border-slate-600">
                    <FileImage size={16} className="text-brand-500 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                    <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Button
          className="w-full"
          icon={<Upload size={15} />}
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          {submitLabel}
        </Button>
      </div>
    </PortalLayout>
  )
}
