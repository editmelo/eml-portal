/**
 * Email Service — routes all portal emails through a Make (Integromat) webhook.
 *
 * ── Make scenario: "EML Portal — Email Notifications" ─────────────────────────
 * Webhook URL: https://hook.us2.make.com/6fwnol9s5zxubtz13c11k4ci60rk1x9o
 * Scenario ID: 4517004  (us2.make.com)
 *
 * ── One step remaining in Make ────────────────────────────────────────────────
 * 1. Open make.com → Scenarios → "EML Portal — Email Notifications"
 * 2. Click the + after the webhook trigger
 * 3. Search for "Email" → "Send an Email"
 * 4. Connect your Google Workspace account (lauren@editmelo.com)
 * 5. Map the fields:
 *      To      → {{1.to_email}}
 *      Subject → {{1.subject}}
 *      Content → {{1.message}}  (set type to HTML)
 * 6. Save + turn the scenario ON (toggle top-right)
 *
 * Until the scenario is live, sends are simulated (console + toast).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import toast from 'react-hot-toast'

const MAKE_WEBHOOK = 'https://hook.us2.make.com/6fwnol9s5zxubtz13c11k4ci60rk1x9o'

// ── Core send ─────────────────────────────────────────────────────────────────
async function _send(params) {
  try {
    const res = await fetch(MAKE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`Make webhook returned ${res.status}`)
    return true
  } catch (err) {
    // Fallback: log so nothing is silently lost
    console.log(
      `%c[Email — simulated]`,
      'color:#47C9F3;font-weight:bold',
      `\nTo: ${params.to_email}`,
      `\nSubject: ${params.subject}`,
      '\n', params
    )
    return false
  }
}

// ── Invite templates ──────────────────────────────────────────────────────────
export const INVITE_TEMPLATES = {
  CLIENT: {
    standard: (name) =>
      `Hi ${name},\n\nYou've been invited to the Edit Me Lo Client Portal — your dedicated space to track your project, review designs, manage invoices, and communicate directly with your creative team.\n\nClick the link below to create your account and get started. We're excited to work with you!`,
    warm: (name) =>
      `Hi ${name}!\n\nWe are SO excited to start this journey with you. Your Edit Me Lo portal is ready and waiting — it's your personal hub for everything related to your project. From checking in on progress to leaving feedback on designs, it's all right there.\n\nCan't wait to create something amazing together! Click below to set up your account.`,
    brief: (name) =>
      `Hi ${name},\n\nYour Edit Me Lo client portal is ready. Click the link below to create your account and access your project dashboard.`,
  },
  DESIGNER: {
    standard: (name) =>
      `Hi ${name},\n\nYou've been invited to join the Edit Me Lo designer portal. This is where you'll manage your assigned projects, upload work for client review, track your earnings, and stay connected with the team.\n\nLooking forward to collaborating with you — click below to set up your account!`,
    warm: (name) =>
      `Hi ${name}!\n\nWelcome to the Edit Me Lo family! We're thrilled to have you on the team. Your designer portal is set up and ready — projects, client comms, earnings tracking, and more all in one place.\n\nClick below to get started. Let's build something great together!`,
    brief: (name) =>
      `Hi ${name},\n\nYou've been invited to join Edit Me Lo as a designer. Click the link below to set up your portal account.`,
  },
}

// ── Send invite email ─────────────────────────────────────────────────────────
export async function sendInviteEmail({ role, ownerName, email, companyName, message, inviteId }) {
  const subject = role === 'DESIGNER'
    ? "You're invited to join Edit Me Lo as a Designer"
    : "You're invited to the Edit Me Lo Client Portal"

  const signupUrl = inviteId
    ? `${window.location.origin}/signup?invite=${inviteId}`
    : `${window.location.origin}/signup`

  // Single styled button — no raw URL or duplicates
  const fullMessage = message.replace(/\n/g, '<br>') +
    `<br><br><a href="${signupUrl}" style="display:inline-block;padding:12px 24px;background:#124F9E;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Create Your Account &rarr;</a>`

  await _send({
    to_name:    ownerName,
    to_email:   email,
    subject,
    company:    companyName,
    role:       role === 'DESIGNER' ? 'Designer' : 'Client',
    message:    fullMessage,
    signup_url: signupUrl,
  })

  toast.success(`Invite sent to ${email}`, {
    icon: '✉️',
    style: { background: '#0d1f3c', color: '#e2e8f0', border: '1px solid #1e3a5f' },
  })
}

// ── Notification events ───────────────────────────────────────────────────────
const NOTIF_CONFIGS = {
  new_message: {
    subject: (d) => `New message from ${d.senderName}`,
    body:    (d) =>
      `Hi ${d.recipientName},\n\n${d.senderName} sent you a message on the Edit Me Lo portal:\n\n"${d.preview}"\n\nLog in to reply.`,
  },
  new_note: {
    subject: (d) => `New note on ${d.projectName}`,
    body:    (d) =>
      `Hi ${d.recipientName},\n\n${d.authorName} left a note on your project "${d.projectName}":\n\n"${d.preview}"\n\nLog in to view the full conversation.`,
  },
  project_status_changed: {
    subject: (d) => `Project update: ${d.projectName}`,
    body:    (d) =>
      `Hi ${d.recipientName},\n\nYour project "${d.projectName}" has moved to ${d.status}.\n\nLog in to your portal to see the latest details.`,
  },
  designer_assigned: {
    subject: (d) => `You've been assigned to: ${d.projectName}`,
    body:    (d) =>
      `Hi ${d.recipientName},\n\nYou've been assigned to the project "${d.projectName}". Log in to your designer portal to view the brief and get started.`,
  },
  new_draft_uploaded: {
    subject: (d) => `New designs ready for review — ${d.projectName}`,
    body:    (d) =>
      `Hi ${d.recipientName},\n\nYour designer has uploaded new drafts for "${d.projectName}" and they're ready for your review.\n\nLog in to view the designs and leave feedback.`,
  },
}

/**
 * Send a portal notification email.
 * @param {string} event - key from NOTIF_CONFIGS
 * @param {string} recipientEmail
 * @param {object} data - template variables
 */
export async function sendNotification(event, recipientEmail, data) {
  const config = NOTIF_CONFIGS[event]
  if (!config || !recipientEmail) return

  const subject = config.subject(data)
  const body    = config.body(data)

  await _send({
    to_name:    data.recipientName ?? recipientEmail,
    to_email:   recipientEmail,
    subject,
    message:    body,
    portal_url: window.location.origin,
  })

  // Always show a subtle in-app indicator (useful even with real email)
  toast(`Email notification sent to ${recipientEmail}`, {
    icon: '📧',
    style: { fontSize: '11px', background: '#1e293b', color: '#64748b', border: '1px solid #334155' },
    duration: 2000,
  })
}
