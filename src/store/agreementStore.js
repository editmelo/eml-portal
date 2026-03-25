import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const EXPIRY_YEARS  = 1
const WARN_DAYS     = 30   // show renewal warning this many days before expiry

function addYear(isoDate) {
  const d = new Date(isoDate)
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS)
  return d.toISOString()
}

function daysUntil(isoDate) {
  return Math.floor((new Date(isoDate) - Date.now()) / (1000 * 60 * 60 * 24))
}

/**
 * Agreement Store — tracks every signed document.
 *
 * Record shape:
 * {
 *   id            string   — unique ID
 *   docId         string   — 'subcontractor' | 'nda'
 *   title         string
 *   pdfPath       string   — path to the blank template PDF
 *   signerRole    'DESIGNER' | 'CLIENT'
 *   signerId      string
 *   signerName    string
 *   signerEmail   string
 *   signatureText string   — typed name used as e-signature
 *   signedAt      string   — ISO
 *   expiresAt     string   — ISO (signedAt + 1 year)
 *   ipNote        string
 *   version       string   — '1.0', '2.0', etc. (increments on renewal)
 *   status        'signed' | 'revoked'
 * }
 */
const useAgreementStore = create(
  persist(
    (set, get) => ({
      agreements: [],

      /** Sign a document. Creates a new record (new version if renewing). */
      signAgreement: ({ docId, title, pdfPath, signerRole, signerId, signerName, signerEmail, signatureText }) => {
        // Compute version — count how many times this signer has signed this doc
        const priorCount = get().agreements.filter(
          (a) => a.signerId === signerId && a.docId === docId
        ).length
        const version = `${priorCount + 1}.0`

        const signedAt  = new Date().toISOString()
        const expiresAt = addYear(signedAt)

        const record = {
          id:            `agr_${Date.now()}`,
          docId,
          title,
          pdfPath,
          signerRole,
          signerId,
          signerName,
          signerEmail:   signerEmail ?? '',
          signatureText,
          signedAt,
          expiresAt,
          ipNote:        'Signed via EML Portal',
          version,
          status:        'signed',
        }
        set((s) => ({ agreements: [record, ...s.agreements] }))
        return record
      },

      /** All agreements for a specific signer, newest first */
      getSignerAgreements: (signerId) =>
        get().agreements
          .filter((a) => a.signerId === signerId)
          .sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt)),

      /**
       * The most recent ACTIVE (non-expired, signed) record for a signer+doc.
       * Returns null if none exists or if all have expired.
       */
      getActiveRecord: (signerId, docId) => {
        const candidates = get().agreements.filter(
          (a) => a.signerId === signerId && a.docId === docId && a.status === 'signed'
        )
        if (!candidates.length) return null
        const latest = candidates.sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]
        return new Date(latest.expiresAt) > new Date() ? latest : null
      },

      /** Most recent record regardless of expiry (for history) */
      getLatestRecord: (signerId, docId) => {
        const matches = get().agreements.filter(
          (a) => a.signerId === signerId && a.docId === docId
        )
        if (!matches.length) return null
        return matches.sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]
      },

      /** Has a current (non-expired) signed record */
      isActive: (signerId, docId) =>
        get().agreements.some(
          (a) => a.signerId === signerId && a.docId === docId &&
                 a.status === 'signed' && new Date(a.expiresAt) > new Date()
        ),

      /** Has ever signed, but the latest is expired */
      isExpired: (signerId, docId) => {
        const matches = get().agreements.filter(
          (a) => a.signerId === signerId && a.docId === docId && a.status === 'signed'
        )
        if (!matches.length) return false
        const latest = matches.sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]
        return new Date(latest.expiresAt) <= new Date()
      },

      /** Active but expiring within WARN_DAYS days */
      isExpiringSoon: (signerId, docId) => {
        const rec = get().agreements
          .filter((a) => a.signerId === signerId && a.docId === docId && a.status === 'signed')
          .sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]
        if (!rec) return false
        const days = daysUntil(rec.expiresAt)
        return days >= 0 && days <= WARN_DAYS
      },

      /** Days remaining on the active agreement (-ve means expired) */
      daysRemaining: (signerId, docId) => {
        const rec = get().agreements
          .filter((a) => a.signerId === signerId && a.docId === docId && a.status === 'signed')
          .sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))[0]
        if (!rec) return null
        return daysUntil(rec.expiresAt)
      },
    }),
    {
      name: 'eml_agreements',
      partialize: (s) => ({ agreements: s.agreements }),
    }
  )
)

export default useAgreementStore
