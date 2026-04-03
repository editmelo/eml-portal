import { ROLES, PROJECT_STATUS, INVOICE_STATUS } from './constants'

// ─── Demo Users ───────────────────────────────────────────────────────────────
// These are used for dev login. Replace with real auth (Supabase, etc.) later.
export const MOCK_USERS = [
  {
    id: 'usr_admin_001',
    email: 'lo@editmelo.com',
    password: 'admin123',       // dev only — never ship real passwords
    name: 'Lo',
    role: ROLES.ADMIN,
    avatar: null,
  },
  {
    id: 'usr_client_001',
    email: 'client@example.com',
    password: 'client123',
    name: 'Jordan Rivera',
    role: ROLES.CLIENT,
    avatar: null,
    projectId: 'proj_001',
  },
  {
    id: 'usr_client_002',
    email: 'client2@example.com',
    password: 'client123',
    name: 'Sam Chen',
    role: ROLES.CLIENT,
    avatar: null,
    projectId: 'proj_002',
  },
  {
    id: 'usr_designer_001',
    email: 'designer@example.com',
    password: 'designer123',
    name: 'Alex Mora',
    role: ROLES.DESIGNER,
    avatar: null,
    specialty: 'Brand Identity & Logo Design',
    birthday: '1995-07-14',
    favFood: 'Spicy Takis & Thai iced tea',
    funFact: 'Has a collection of 200+ vintage band tees and can name every font in a logo within 3 seconds.',
  },
  {
    id: 'usr_designer_002',
    email: 'designer2@example.com',
    password: 'designer123',
    name: 'Taylor Brooks',
    role: ROLES.DESIGNER,
    avatar: null,
    specialty: 'UI/UX & Web Design',
    birthday: '1998-03-22',
    favFood: 'Cold brew coffee and anything with matcha',
    funFact: 'Used to work as a muralist before going digital. Still paints every weekend.',
  },
]

// ─── Mock Projects ────────────────────────────────────────────────────────────
export const MOCK_PROJECTS = [
  {
    id: 'proj_001',
    name: 'Rivera Brand Identity',
    clientId: 'usr_client_001',
    designerIds: ['usr_designer_001'],
    status: PROJECT_STATUS.IN_PROGRESS,
    startDate: '2026-02-15',
    dueDate: '2026-04-30',
    projectValue: 3500,
    designerPayout: 900,
    progress: 60,
    brief: 'Full brand identity suite: logo, color palette, typography, brand guidelines.',
    tags: ['Branding', 'Logo', 'Guidelines'],
    drafts: [
      {
        id: 'draft_001',
        url: 'https://placehold.co/800x600/7c3aed/fff?text=Logo+Draft+v1',
        label: 'Logo Concept v1',
        uploadedAt: '2026-03-10',
        designerId: 'usr_designer_001',
        comments: [
          {
            id: 'cmt_001',
            authorId: 'usr_client_001',
            text: 'Love the direction! Can we make the accent color warmer?',
            x: 42,
            y: 38,
            createdAt: '2026-03-11',
          },
        ],
      },
    ],
  },
  {
    id: 'proj_002',
    name: 'Chen Co. Website Redesign',
    clientId: 'usr_client_002',
    designerIds: ['usr_designer_001', 'usr_designer_002'],
    status: PROJECT_STATUS.DRAFT_1,
    startDate: '2026-01-20',
    dueDate: '2026-03-31',
    projectValue: 6800,
    designerPayout: 2000,
    progress: 85,
    brief: 'Full website redesign including landing page, about, services, and contact.',
    tags: ['Web Design', 'UI/UX'],
    drafts: [],
  },
  {
    id: 'proj_003',
    name: 'Bloom Social Media Kit',
    clientId: null,
    designerIds: [],
    status: PROJECT_STATUS.NEW,
    startDate: null,
    dueDate: null,
    projectValue: 1200,
    designerPayout: 0,
    progress: 0,
    brief: 'Social media template kit for Instagram and LinkedIn.',
    tags: ['Social Media', 'Templates'],
    drafts: [],
  },
]

// ─── Mock Leads ───────────────────────────────────────────────────────────────
export const MOCK_LEADS = [
  {
    id: 'lead_001',
    name: 'Marcus Johnson',
    company: 'Bloom Studio',
    email: 'marcus@bloom.co',
    service: 'Social Media Kit',
    potentialValue: 1200,
    source: 'Instagram',
    submittedAt: '2026-03-18',
    status: 'New',
    notes: 'Interested in monthly retainer after initial kit.',
    converted: false,
  },
  {
    id: 'lead_002',
    name: 'Priya Nair',
    company: 'Nair Consulting',
    email: 'priya@nair.co',
    service: 'Brand Identity',
    potentialValue: 4500,
    source: 'Referral',
    submittedAt: '2026-03-20',
    status: 'Consultation',
    notes: 'Referred by Jordan Rivera. Has existing logo but wants full refresh.',
    converted: false,
  },
  {
    id: 'lead_003',
    name: 'Derek Wu',
    company: 'Wu Creative',
    email: 'derek@wucreative.com',
    service: 'Website + Branding',
    potentialValue: 8000,
    source: 'LinkedIn',
    submittedAt: '2026-03-05',
    status: 'Project Proposal',
    notes: 'Large scope. Needs proposal by end of month.',
    converted: false,
  },
]

// ─── Mock Invoices ────────────────────────────────────────────────────────────
export const MOCK_INVOICES = [
  {
    id: 'inv_001',
    projectId: 'proj_001',
    clientId: 'usr_client_001',
    amount: 1750,
    status: INVOICE_STATUS.PAID,
    issuedAt: '2026-02-15',
    paidAt: '2026-02-18',
    description: 'Brand Identity — 50% deposit',
  },
  {
    id: 'inv_002',
    projectId: 'proj_001',
    clientId: 'usr_client_001',
    amount: 1750,
    status: INVOICE_STATUS.PENDING,
    issuedAt: '2026-03-20',
    paidAt: null,
    description: 'Brand Identity — Final 50%',
  },
  {
    id: 'inv_003',
    projectId: 'proj_002',
    clientId: 'usr_client_002',
    amount: 3400,
    status: INVOICE_STATUS.PAID,
    issuedAt: '2026-01-20',
    paidAt: '2026-01-22',
    description: 'Website Redesign — 50% deposit',
  },
  {
    id: 'inv_004',
    projectId: 'proj_002',
    clientId: 'usr_client_002',
    amount: 3400,
    status: INVOICE_STATUS.PENDING,
    issuedAt: '2026-03-15',
    paidAt: null,
    description: 'Website Redesign — Final 50%',
  },
]

// ─── Financial Summary (for Admin dashboard) ──────────────────────────────────
export const MOCK_FINANCIALS = {
  revenueGoalMonthly: 8000,
  revenueGoalYearly: 96000,
  currentMonth: {
    label: 'March 2026',
    revenue: 5150,
    expenses: 1200,
    profit: 3950,
  },
  ytd: {
    revenue: 14550,
    expenses: 3600,
    profit: 10950,
  },
  monthlyBreakdown: [
    { month: 'Jan', revenue: 3400, expenses: 800 },
    { month: 'Feb', revenue: 6000, expenses: 1400 },
    { month: 'Mar', revenue: 5150, expenses: 1200 },
  ],
}

// ─── Designer Payroll ─────────────────────────────────────────────────────────
export const MOCK_PAYROLL = [
  {
    id: 'pay_001',
    designerId: 'usr_designer_001',
    projectId: 'proj_001',
    amount: 900,
    status: 'Pending',
    dueDate: '2026-04-30',
  },
  {
    id: 'pay_002',
    designerId: 'usr_designer_001',
    projectId: 'proj_002',
    amount: 1400,
    status: 'Paid',
    paidDate: '2026-03-01',
  },
  {
    id: 'pay_003',
    designerId: 'usr_designer_002',
    projectId: 'proj_002',
    amount: 600,
    status: 'Paid',
    paidDate: '2026-03-01',
  },
]
