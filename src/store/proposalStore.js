import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function addDays(isoDate, days) {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/**
 * Proposal Store — manages the full client paperwork lifecycle.
 *
 * Flow:
 *  Admin creates proposal (draft) → sends it (sent) →
 *  Client accepts → Service Agreement auto-created (pending) → Client signs
 *  Client denies → Admin revises → resends (repeats until accepted)
 *
 * Addendums: Admin creates at any time → Client signs
 *
 * ── Proposal record ─────────────────────────────────────────────────────
 * {
 *   id            string   — 'prop_...'
 *   projectId     string
 *   clientId      string
 *   clientName    string
 *   clientEmail   string
 *   projectName   string
 *   serviceTitle  string   — e.g. 'Brand Identity Package'
 *   packageTier   string   — 'Starter' | 'Growth' | 'Premium' | 'Custom'
 *   scopeItems    string[] — list of deliverables
 *   timeline      string   — e.g. '4–6 weeks'
 *   totalAmount   number
 *   depositAmount number   — 50% of total
 *   notes         string
 *   status        'draft' | 'sent' | 'accepted' | 'denied'
 *   revisions     [{ round, deniedAt, denialNotes, revisedAt }]
 *   version       number   — increments on each revision
 *   sentAt        string | null
 *   validUntil    string | null  — sentAt + 30 days
 *   respondedAt   string | null
 *   createdAt     string
 * }
 *
 * ── Service Agreement record ─────────────────────────────────────────────
 * {
 *   id              string   — 'svc_...'
 *   proposalId      string
 *   projectId       string
 *   clientId        string
 *   clientName      string
 *   clientEmail     string
 *   projectName     string
 *   serviceTitle    string
 *   packageTier     string
 *   scopeItems      string[]
 *   timeline        string
 *   totalAmount     number
 *   depositAmount   number
 *   notes           string
 *   signatureText   string | null
 *   signedAt        string | null
 *   sentAt          string
 *   status          'pending' | 'signed'
 * }
 *
 * ── Addendum record ──────────────────────────────────────────────────────
 * {
 *   id              string   — 'add_...'
 *   projectId       string
 *   clientId        string
 *   clientName      string
 *   clientEmail     string
 *   projectName     string
 *   title           string
 *   description     string
 *   additionalItems string[]
 *   additionalCost  number
 *   signatureText   string | null
 *   signedAt        string | null
 *   sentAt          string
 *   status          'pending' | 'signed'
 * }
 */
const useProposalStore = create(
  persist(
    (set, get) => ({
      proposals:        [],
      serviceAgreements: [],
      addendums:        [],

      // ── Proposals ────────────────────────────────────────────────────────

      /** Admin creates a new proposal (starts as draft, not yet sent). */
      createProposal: (fields) => {
        const record = {
          id:           `prop_${Date.now()}`,
          ...fields,
          status:       'draft',
          revisions:    [],
          version:      1,
          sentAt:       null,
          validUntil:   null,
          respondedAt:  null,
          createdAt:    new Date().toISOString(),
        }
        set((s) => ({ proposals: [record, ...s.proposals] }))
        return record
      },

      /** Admin sends the proposal to the client. */
      sendProposal: (proposalId) => {
        const sentAt     = new Date().toISOString()
        const validUntil = addDays(sentAt, 30)
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, status: 'sent', sentAt, validUntil } : p
          ),
        }))
      },

      /** Admin updates a draft proposal's fields. */
      updateProposal: (proposalId, fields) => {
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, ...fields } : p
          ),
        }))
      },

      /** Client accepts a proposal → auto-creates a pending Service Agreement. */
      acceptProposal: (proposalId) => {
        const now      = new Date().toISOString()
        const proposal = get().proposals.find((p) => p.id === proposalId)
        if (!proposal) return null

        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, status: 'accepted', respondedAt: now } : p
          ),
        }))

        const sa = {
          id:             `svc_${Date.now()}`,
          proposalId,
          projectId:      proposal.projectId,
          clientId:       proposal.clientId,
          clientName:     proposal.clientName,
          clientEmail:    proposal.clientEmail,
          projectName:    proposal.projectName,
          serviceTitle:   proposal.serviceTitle,
          packageTier:    proposal.packageTier,
          scopeItems:     proposal.scopeItems,
          timeline:       proposal.timeline,
          totalAmount:    proposal.totalAmount,
          depositAmount:  proposal.depositAmount,
          notes:          proposal.notes,
          signatureText:  null,
          signedAt:       null,
          sentAt:         now,
          status:         'pending',
        }
        set((s) => ({ serviceAgreements: [sa, ...s.serviceAgreements] }))
        return sa
      },

      /** Client denies a proposal and leaves revision notes. */
      denyProposal: (proposalId, denialNotes) => {
        const now = new Date().toISOString()
        set((s) => ({
          proposals: s.proposals.map((p) => {
            if (p.id !== proposalId) return p
            const round = (p.revisions?.length ?? 0) + 1
            return {
              ...p,
              status:       'denied',
              respondedAt:  now,
              revisions: [
                ...(p.revisions ?? []),
                { round, deniedAt: now, denialNotes, revisedAt: null },
              ],
            }
          }),
        }))
      },

      /**
       * Admin revises a denied proposal and re-sends it.
       * Version increments, latest revision gets a revisedAt timestamp.
       */
      reviseProposal: (proposalId, updatedFields) => {
        const now        = new Date().toISOString()
        const validUntil = addDays(now, 30)
        set((s) => ({
          proposals: s.proposals.map((p) => {
            if (p.id !== proposalId) return p
            const revisions = (p.revisions ?? []).map((r, i) =>
              i === (p.revisions.length - 1) ? { ...r, revisedAt: now } : r
            )
            return {
              ...p,
              ...updatedFields,
              status:       'sent',
              sentAt:       now,
              validUntil,
              respondedAt:  null,
              version:      p.version + 1,
              revisions,
            }
          }),
        }))
      },

      // ── Service Agreements ───────────────────────────────────────────────

      /** Client signs the Service Agreement. */
      signServiceAgreement: (saId, signatureText) => {
        const now = new Date().toISOString()
        set((s) => ({
          serviceAgreements: s.serviceAgreements.map((sa) =>
            sa.id === saId ? { ...sa, signatureText, signedAt: now, status: 'signed' } : sa
          ),
        }))
      },

      // ── Addendums ────────────────────────────────────────────────────────

      /** Admin creates an addendum and sends it to the client. */
      createAddendum: (fields) => {
        const now    = new Date().toISOString()
        const record = {
          id:             `add_${Date.now()}`,
          ...fields,
          signatureText:  null,
          signedAt:       null,
          sentAt:         now,
          status:         'pending',
          createdAt:      now,
        }
        set((s) => ({ addendums: [record, ...s.addendums] }))
        return record
      },

      /** Client signs an addendum. */
      signAddendum: (addendumId, signatureText) => {
        const now = new Date().toISOString()
        set((s) => ({
          addendums: s.addendums.map((a) =>
            a.id === addendumId ? { ...a, signatureText, signedAt: now, status: 'signed' } : a
          ),
        }))
      },

      // ── Selectors ────────────────────────────────────────────────────────

      getClientProposals: (clientId) =>
        get().proposals
          .filter((p) => p.clientId === clientId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

      getClientServiceAgreements: (clientId) =>
        get().serviceAgreements
          .filter((sa) => sa.clientId === clientId)
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)),

      getClientAddendums: (clientId) =>
        get().addendums
          .filter((a) => a.clientId === clientId)
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)),

      /** Latest sent/accepted/denied proposal for a client (not drafts). */
      getActiveProposal: (clientId) =>
        get().proposals
          .filter((p) => p.clientId === clientId && p.status !== 'draft')
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0] ?? null,
    }),
    {
      name: 'eml_proposals',
      partialize: (s) => ({
        proposals:         s.proposals,
        serviceAgreements: s.serviceAgreements,
        addendums:         s.addendums,
      }),
    }
  )
)

export default useProposalStore
