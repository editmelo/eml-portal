import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { CheckCircle2, ChevronRight, ChevronLeft, Edit2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'

// ── Steps definition ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Business Info',    desc: 'Tell us about your company' },
  { id: 2, title: 'Project Scope',    desc: 'What do you need designed?' },
  { id: 3, title: 'Brand & Style',    desc: 'Your visual identity preferences' },
  { id: 4, title: 'Audience & Goals', desc: 'Who you serve and what success looks like' },
  { id: 5, title: 'Review & Submit',  desc: 'Confirm everything looks right' },
]

const EMPTY_FORM = {
  // Step 1 — Business Info
  companyName:    '',
  industry:       '',
  website:        '',
  contactName:    '',
  contactEmail:   '',
  contactPhone:   '',
  businessDesc:   '',
  // Step 2 — Project Scope
  serviceType:    '',
  deliverables:   '',
  timeline:       '',
  budget:         '',
  hasBrandAssets: '',
  additionalNotes:'',
  // Step 3 — Brand & Style
  brandPersonality: [],
  colorPrefs:     '',
  colorsToAvoid:  '',
  fontStyle:      '',
  inspirationBrands: '',
  existingColors:  '',
  // Step 4 — Audience & Goals
  targetAudience:  '',
  ageRange:        '',
  primaryGoal:     '',
  successLooksLike:'',
  competitors:     '',
}

const BRAND_PERSONALITY_OPTIONS = [
  'Professional', 'Playful', 'Minimal', 'Bold',
  'Luxury', 'Approachable', 'Innovative', 'Classic',
]

const FIELD_LABELS = {
  companyName:       'Company Name',
  industry:          'Industry',
  website:           'Website',
  contactName:       'Contact Name',
  contactEmail:      'Contact Email',
  contactPhone:      'Contact Phone',
  businessDesc:      'Business Description',
  serviceType:       'Service Type',
  deliverables:      'Deliverables Needed',
  timeline:          'Ideal Timeline',
  budget:            'Budget Range',
  hasBrandAssets:    'Has Existing Brand Assets',
  additionalNotes:   'Additional Notes',
  brandPersonality:  'Brand Personality',
  colorPrefs:        'Color Preferences',
  colorsToAvoid:     'Colors to Avoid',
  fontStyle:         'Font Style Preference',
  inspirationBrands: 'Inspiration Brands',
  existingColors:    'Existing Brand Colors',
  targetAudience:    'Target Audience',
  ageRange:          'Age Range',
  primaryGoal:       'Primary Goal',
  successLooksLike:  'What Success Looks Like',
  competitors:       'Competitors / Similar Brands',
}

// ── Shared input class (no global css dependency) ─────────────────────────────
const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white'
const INPUT_ERR = 'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300/40 bg-white'
const LABEL = 'block text-xs font-medium text-slate-600 mb-1.5'

// ── Required fields per step ───────────────────────────────────────────────────
const REQUIRED = {
  1: ['companyName', 'industry', 'contactName', 'contactEmail', 'businessDesc'],
  2: ['serviceType', 'timeline', 'budget'],
  3: [],
  4: ['targetAudience', 'primaryGoal'],
  5: [],
}

function isStepValid(step, form) {
  return (REQUIRED[step] ?? []).every((field) => {
    const val = form[field]
    return Array.isArray(val) ? val.length > 0 : val?.trim?.() !== ''
  })
}

function isMissing(field, step, form, attempted) {
  if (!attempted) return false
  if (!(REQUIRED[step] ?? []).includes(field)) return false
  const val = form[field]
  return Array.isArray(val) ? val.length === 0 : !val?.trim?.()
}

// ── Brief generator — builds the three-section structured brief from form data ─
function generateProjectBrief(form) {
  // Project Overview — one paragraph
  const overviewParts = []
  if (form.companyName && form.industry) {
    overviewParts.push(`${form.companyName} is a ${form.industry} business.`)
  } else if (form.companyName) {
    overviewParts.push(`${form.companyName} is seeking design services.`)
  }
  if (form.businessDesc) {
    const desc = form.businessDesc.trim().replace(/\.+$/, '')
    overviewParts.push(desc + '.')
  }
  if (form.serviceType) {
    const goal = form.primaryGoal ? ` to ${form.primaryGoal.trim().replace(/\.+$/, '').toLowerCase()}` : ''
    overviewParts.push(`They are looking for ${form.serviceType.toLowerCase()} services${goal}.`)
  } else if (form.primaryGoal) {
    overviewParts.push(`Their primary goal: ${form.primaryGoal.trim()}.`)
  }
  const overview = overviewParts.join(' ')

  // Key Objectives — bullet list, max 6
  const objectives = []
  if (form.primaryGoal)            objectives.push(form.primaryGoal.trim())
  if (form.successLooksLike)       objectives.push(form.successLooksLike.trim())
  if (form.targetAudience) {
    const audience = form.ageRange
      ? `Connect with ${form.targetAudience} (ages ${form.ageRange})`
      : `Connect with ${form.targetAudience}`
    objectives.push(audience)
  }
  if (form.brandPersonality?.length > 0) {
    objectives.push(`Communicate a ${form.brandPersonality.join(', ').toLowerCase()} brand personality`)
  }
  if (form.hasBrandAssets === 'yes') {
    objectives.push('Build upon and unify existing brand assets')
  } else if (form.hasBrandAssets === 'no') {
    objectives.push('Establish a brand identity from the ground up')
  }
  if (form.timeline) objectives.push(`Deliver within ${form.timeline}`)

  // Deliverables — what the client receives
  const deliverables = form.deliverables?.trim() ?? ''

  return {
    overview,
    objectives: objectives.slice(0, 6),
    deliverables,
    // preserve raw data for reference
    companyName: form.companyName, industry: form.industry, website: form.website,
    serviceType: form.serviceType, timeline: form.timeline, budget: form.budget,
    brandPersonality: form.brandPersonality, colorPrefs: form.colorPrefs,
    colorsToAvoid: form.colorsToAvoid, fontStyle: form.fontStyle,
    inspirationBrands: form.inspirationBrands, existingColors: form.existingColors,
    targetAudience: form.targetAudience, ageRange: form.ageRange,
    primaryGoal: form.primaryGoal, successLooksLike: form.successLooksLike,
    competitors: form.competitors, additionalNotes: form.additionalNotes,
  }
}

export default function ClientOnboarding() {
  const user          = useAuthStore(selectUser)
  const projects      = useProjectStore((s) => s.projects)
  const saveIntakeForm = useProjectStore((s) => s.saveIntakeForm)
  const getIntakeForm  = useProjectStore((s) => s.getIntakeForm)

  const saveProjectBrief = useProjectStore((s) => s.saveProjectBrief)

  const project   = projects.find((p) => p.id === user?.projectId)
  const projectId = project?.id ?? `guest_${user?.id}`

  const existing = getIntakeForm(projectId)
  const isDraft  = existing?.draft === true

  const [step,      setStep]      = useState(isDraft ? (existing.lastStep ?? 1) : 1)
  const [editing,   setEditing]   = useState(!existing || isDraft)
  const [form,      setForm]      = useState(existing ? { ...EMPTY_FORM, ...existing } : EMPTY_FORM)
  const [attempted, setAttempted] = useState(false)

  const set_ = (field, val) => setForm((f) => ({ ...f, [field]: val }))
  const togglePersonality = (opt) => {
    setForm((f) => ({
      ...f,
      brandPersonality: f.brandPersonality.includes(opt)
        ? f.brandPersonality.filter((x) => x !== opt)
        : [...f.brandPersonality, opt],
    }))
  }

  const err = (field) => isMissing(field, step, form, attempted)
  const hasAnyInput = Object.entries(EMPTY_FORM).some(([key, empty]) => {
    const val = form[key]
    return Array.isArray(empty) ? val?.length > 0 : val?.trim?.() !== ''
  })

  const next = () => {
    if (!isStepValid(step, form)) { setAttempted(true); return }
    setAttempted(false)
    setStep((s) => Math.min(s + 1, STEPS.length))
  }
  const back = () => { setAttempted(false); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = () => {
    // Remove draft fields before final submission
    const { draft, lastStep, savedAt, ...cleanForm } = form
    saveIntakeForm(projectId, cleanForm)

    // Auto-generate a structured project brief visible to admin + designer (not client)
    saveProjectBrief(projectId, generateProjectBrief(cleanForm))

    toast.success('Intake form saved! Your information is on file.')
    setEditing(false)
  }

  const handleSaveDraft = () => {
    saveIntakeForm(projectId, { ...form, draft: true, lastStep: step, savedAt: new Date().toISOString() })
    toast.success('Progress saved! You can continue anytime.')
  }

  // ── Submitted view ────────────────────────────────────────────────────────
  if (!editing && existing && !isDraft) {
    return (
      <PortalLayout>
        <div className="flex items-start justify-between mb-8">
          <PageHeader
            title="Client Intake Form"
            subtitle={`Submitted ${formatDate(existing.submittedAt?.split('T')[0] ?? '')}`}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit2 size={14} />}
            onClick={() => { setEditing(true); setStep(1) }}
          >
            Edit
          </Button>
        </div>

        <div className="space-y-5">
          {/* Step sections as read-only cards */}
          {[
            {
              title: 'Business Info',
              fields: ['companyName','industry','website','contactName','contactEmail','contactPhone','businessDesc'],
            },
            {
              title: 'Project Scope',
              fields: ['serviceType','deliverables','timeline','budget','hasBrandAssets','additionalNotes'],
            },
            {
              title: 'Brand & Style',
              fields: ['brandPersonality','colorPrefs','colorsToAvoid','fontStyle','inspirationBrands','existingColors'],
            },
            {
              title: 'Audience & Goals',
              fields: ['targetAudience','ageRange','primaryGoal','successLooksLike','competitors'],
            },
          ].map((section) => (
            <Card key={section.title}>
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
              </div>
              <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {section.fields.map((f) => {
                  const val = existing[f]
                  if (!val || (Array.isArray(val) && val.length === 0)) return null
                  return (
                    <div key={f}>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                        {FIELD_LABELS[f]}
                      </p>
                      <p className="text-sm text-slate-700">
                        {Array.isArray(val) ? val.join(', ') : val}
                      </p>
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          ))}
        </div>
      </PortalLayout>
    )
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  return (
    <PortalLayout>
      <PageHeader
        title="Client Intake Form"
        subtitle="Fill out your information so we can deliver the best results for your project."
        className="mb-8"
      />

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors ${
                step > s.id
                  ? 'bg-emerald-500 text-white cursor-pointer'
                  : step === s.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-default'
              }`}
            >
              {step > s.id ? <CheckCircle2 size={13} /> : s.id}
            </button>
            <span className={`hidden sm:block text-xs font-medium whitespace-nowrap ${
              step === s.id ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
            }`}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      <ProgressBar value={step - 1} max={STEPS.length - 1} className="mb-6" />

      <Card className="max-w-2xl">
        <CardBody className="space-y-5">

          {/* ── Step 1: Business Info ── */}
          {step === 1 && (
            <>
              <h3 className="text-base font-semibold text-slate-800">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Company Name *</label>
                  <input className={err('companyName') ? INPUT_ERR : INPUT} placeholder="Acme Studio" value={form.companyName} onChange={(e) => set_('companyName', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Industry *</label>
                  <input className={err('industry') ? INPUT_ERR : INPUT} placeholder="e.g. Creative Agency, Retail" value={form.industry} onChange={(e) => set_('industry', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Website</label>
                  <input className={INPUT} placeholder="https://yoursite.com" value={form.website} onChange={(e) => set_('website', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Contact Name *</label>
                  <input className={err('contactName') ? INPUT_ERR : INPUT} placeholder="Your full name" value={form.contactName} onChange={(e) => set_('contactName', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Contact Email *</label>
                  <input className={err('contactEmail') ? INPUT_ERR : INPUT} type="email" placeholder="you@company.com" value={form.contactEmail} onChange={(e) => set_('contactEmail', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Contact Phone</label>
                  <input className={INPUT} type="tel" placeholder="(555) 000-0000" value={form.contactPhone} onChange={(e) => set_('contactPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Tell us about your business *</label>
                <textarea
                  rows={3}
                  className={`${err('businessDesc') ? INPUT_ERR : INPUT} resize-none`}
                  placeholder="What do you do? Who do you serve? What makes you different?"
                  value={form.businessDesc}
                  onChange={(e) => set_('businessDesc', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step 2: Project Scope ── */}
          {step === 2 && (
            <>
              <h3 className="text-base font-semibold text-slate-800">Project Scope</h3>
              <div>
                <label className={LABEL}>Service Type *</label>
                <select className={err('serviceType') ? INPUT_ERR : INPUT} value={form.serviceType} onChange={(e) => set_('serviceType', e.target.value)}>
                  <option value="">Select a service…</option>
                  {[
                    'Brand Identity / Logo Design',
                    'Social Media Kit & Templates',
                    'Website Design',
                    'Marketing Collateral',
                    'Rebranding',
                    'Packaging Design',
                    'Other',
                  ].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Specific Deliverables Needed</label>
                <textarea
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="e.g. Primary logo, secondary logo, brand guidelines, 3 social media templates, business card design…"
                  value={form.deliverables}
                  onChange={(e) => set_('deliverables', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ideal Timeline *</label>
                  <input className={err('timeline') ? INPUT_ERR : INPUT} placeholder="e.g. 4–6 weeks" value={form.timeline} onChange={(e) => set_('timeline', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Budget Range *</label>
                  <input className={err('budget') ? INPUT_ERR : INPUT} placeholder="e.g. $1,500–$3,000" value={form.budget} onChange={(e) => set_('budget', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Do you have existing brand assets? (logos, colors, fonts)</label>
                <select className={INPUT} value={form.hasBrandAssets} onChange={(e) => set_('hasBrandAssets', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Yes — will provide files">Yes — will provide files</option>
                  <option value="Partially — some assets exist">Partially — some assets exist</option>
                  <option value="No — starting from scratch">No — starting from scratch</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Additional Notes or Requests</label>
                <textarea
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="Anything else we should know before getting started?"
                  value={form.additionalNotes}
                  onChange={(e) => set_('additionalNotes', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step 3: Brand & Style ── */}
          {step === 3 && (
            <>
              <h3 className="text-base font-semibold text-slate-800">Brand & Style Preferences</h3>
              <div>
                <label className={LABEL}>Brand Personality (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {BRAND_PERSONALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => togglePersonality(opt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.brandPersonality.includes(opt)
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-brand-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Color Preferences</label>
                  <input className={INPUT} placeholder="e.g. Navy, gold, neutral tones" value={form.colorPrefs} onChange={(e) => set_('colorPrefs', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Colors to Avoid</label>
                  <input className={INPUT} placeholder="e.g. Bright orange, neon green" value={form.colorsToAvoid} onChange={(e) => set_('colorsToAvoid', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Existing Brand Colors (if any)</label>
                  <input className={INPUT} placeholder="e.g. #124F9E, #47C9F3" value={form.existingColors} onChange={(e) => set_('existingColors', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Font / Typography Style</label>
                  <select className={INPUT} value={form.fontStyle} onChange={(e) => set_('fontStyle', e.target.value)}>
                    <option value="">Select a preference…</option>
                    {['Modern & Clean (sans-serif)', 'Classic & Elegant (serif)', 'Bold & Display', 'Handwritten / Script', 'No Preference'].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Inspiration Brands or Styles</label>
                <textarea
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="List brands, websites, or describe a visual direction that resonates with you…"
                  value={form.inspirationBrands}
                  onChange={(e) => set_('inspirationBrands', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step 4: Audience & Goals ── */}
          {step === 4 && (
            <>
              <h3 className="text-base font-semibold text-slate-800">Audience & Goals</h3>
              <div>
                <label className={LABEL}>Describe your target audience *</label>
                <textarea
                  rows={3}
                  className={`${err('targetAudience') ? INPUT_ERR : INPUT} resize-none`}
                  placeholder="Who are your ideal customers? What do they care about? What problem do you solve for them?"
                  value={form.targetAudience}
                  onChange={(e) => set_('targetAudience', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Audience Age Range</label>
                  <select className={INPUT} value={form.ageRange} onChange={(e) => set_('ageRange', e.target.value)}>
                    <option value="">Select…</option>
                    {['Under 18', '18–24', '25–34', '35–44', '45–54', '55+', 'All Ages'].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Primary Goal of This Project *</label>
                  <select className={err('primaryGoal') ? INPUT_ERR : INPUT} value={form.primaryGoal} onChange={(e) => set_('primaryGoal', e.target.value)}>
                    <option value="">Select…</option>
                    {[
                      'Establish a brand from scratch',
                      'Refresh / modernize existing brand',
                      'Launch a new product or service',
                      'Grow social media presence',
                      'Attract a new audience segment',
                      'Stand out from competitors',
                    ].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>What does success look like for this project?</label>
                <textarea
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="e.g. 'Our new brand feels premium and modern. Clients immediately understand what we do.'"
                  value={form.successLooksLike}
                  onChange={(e) => set_('successLooksLike', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Competitors or Similar Brands</label>
                <input
                  className={INPUT}
                  placeholder="List a few brands in your space (good reference points)"
                  value={form.competitors}
                  onChange={(e) => set_('competitors', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <>
              <h3 className="text-base font-semibold text-slate-800">Review & Submit</h3>
              <p className="text-sm text-slate-500">Double-check your information before submitting.</p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {Object.entries(FIELD_LABELS).map(([key, label]) => {
                  const val = form[key]
                  if (!val || (Array.isArray(val) && val.length === 0)) return null
                  return (
                    <div key={key} className="flex gap-3 px-4 py-3">
                      <span className="text-xs text-slate-400 w-40 shrink-0 pt-0.5">{label}</span>
                      <span className="text-sm text-slate-700 font-medium">
                        {Array.isArray(val) ? val.join(', ') : val}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400">
                By submitting you confirm this information is accurate. Edit Me Lo will use this to kick off your project.
              </p>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="secondary" size="sm" icon={<ChevronLeft size={14} />} onClick={back} disabled={step === 1}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<Save size={14} />} onClick={handleSaveDraft} disabled={!hasAnyInput}>
                Save & Continue Later
              </Button>
              {step < STEPS.length ? (
                <Button size="sm" onClick={next} disabled={!isStepValid(step, form)}>
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmit}>
                  Submit Form
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </PortalLayout>
  )
}
