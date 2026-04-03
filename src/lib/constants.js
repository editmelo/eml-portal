// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'ADMIN',     // Business owner (Lo)
  CLIENT:   'CLIENT',    // End clients
  DESIGNER: 'DESIGNER',  // Subcontractors
}

// ─── Project Statuses ────────────────────────────────────────────────────────
export const PROJECT_STATUS = {
  NEW:                'New',
  NOT_STARTED:        'Not Started',
  CONSULTATION:       'Consultation',
  PROJECT_PROPOSAL:   'Project Proposal',
  SERVICE_AGREEMENT:  'Service Agreement',
  INVOICE_DEPOSIT:    'Invoice - Deposit',
  DEPOSIT_PAID:       'Deposit Paid',
  KICK_OFF_CALL:      'Kick-Off Call',
  DRAFT_1:            'Draft 1',
  DRAFT_2:            'Draft 2',
  FINAL_REVISIONS:    'Final Revisions',
  INVOICE_REMAINDER:  'Invoice - Remainder',
  LAUNCH:             'Launch',
  IN_PROGRESS:        'In Progress',
  DONE:               'Done',
  ARCHIVED:           'Archived',
  DEAD:               'Dead',
}

// Status display config: label, color classes
export const STATUS_CONFIG = {
  [PROJECT_STATUS.NEW]:               { label: 'New',               bg: 'bg-brand-100',   text: 'text-brand-700',   dot: 'bg-brand-400' },
  [PROJECT_STATUS.NOT_STARTED]:       { label: 'Not Started',       bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  [PROJECT_STATUS.CONSULTATION]:      { label: 'Consultation',      bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
  [PROJECT_STATUS.PROJECT_PROPOSAL]:  { label: 'Project Proposal',  bg: 'bg-brand-100',   text: 'text-brand-700',   dot: 'bg-brand-400' },
  [PROJECT_STATUS.SERVICE_AGREEMENT]: { label: 'Service Agreement', bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-400' },
  [PROJECT_STATUS.INVOICE_DEPOSIT]:   { label: 'Invoice - Deposit', bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  [PROJECT_STATUS.DEPOSIT_PAID]:      { label: 'Deposit Paid',      bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-400' },
  [PROJECT_STATUS.KICK_OFF_CALL]:     { label: 'Kick-Off Call',     bg: 'bg-brand-100',   text: 'text-brand-700',   dot: 'bg-brand-400' },
  [PROJECT_STATUS.DRAFT_1]:           { label: 'Draft 1',           bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
  [PROJECT_STATUS.DRAFT_2]:           { label: 'Draft 2',           bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
  [PROJECT_STATUS.FINAL_REVISIONS]:   { label: 'Final Revisions',   bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  [PROJECT_STATUS.INVOICE_REMAINDER]: { label: 'Invoice - Remainder', bg: 'bg-amber-100', text: 'text-amber-800',   dot: 'bg-amber-400' },
  [PROJECT_STATUS.LAUNCH]:            { label: 'Launch',            bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-400' },
  [PROJECT_STATUS.IN_PROGRESS]:       { label: 'In Progress',       bg: 'bg-brand-100',   text: 'text-brand-700',   dot: 'bg-brand-400' },
  [PROJECT_STATUS.DONE]:              { label: 'Done',              bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-400' },
  [PROJECT_STATUS.ARCHIVED]:          { label: 'Archived',          bg: 'bg-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  [PROJECT_STATUS.DEAD]:              { label: 'Dead',              bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-400' },
}

// ─── Invoice Statuses ─────────────────────────────────────────────────────────
export const INVOICE_STATUS = {
  PENDING:  'Pending',
  PAID:     'Paid',
  OVERDUE:  'Overdue',
  DRAFT:    'Draft',
}

// ─── Local storage keys ───────────────────────────────────────────────────────
export const LS_KEYS = {
  AUTH_USER:        'eml_auth_user',
  QUOTE_CACHE:      'eml_daily_quote',
  QUOTE_CACHE_DATE: 'eml_daily_quote_date',
  VIEW_ROLE:        'eml_view_role',
}

// ─── Navigation config per role ───────────────────────────────────────────────
export const NAV_CONFIG = {
  [ROLES.ADMIN]: [
    { label: 'At a Glance',     path: '/admin',              icon: 'LayoutDashboard' },
    { label: 'Projects',        path: '/admin/projects',     icon: 'FolderKanban' },
    { label: 'People',          path: '/admin/people',       icon: 'UserCircle' },
    { label: 'Inbox',           path: '/admin/inbox',        icon: 'Mail' },
    { label: 'Timeline',        path: '/admin/timeline',     icon: 'CalendarDays' },
    { label: 'To-Do',           path: '/admin/todo',         icon: 'ListChecks' },
    { label: 'Lead Management', path: '/admin/leads',        icon: 'Users' },
    { label: 'Designer Payroll',path: '/admin/payroll',      icon: 'Wallet' },
    { label: 'Invoices',        path: '/admin/invoices',     icon: 'Receipt' },
    { label: 'Financials',      path: '/admin/financials',   icon: 'BarChart3' },
    { label: 'Agreements',      path: '/admin/agreements',   icon: 'ScrollText' },
  ],
  [ROLES.CLIENT]: [
    { label: 'Dashboard',       path: '/client',                icon: 'LayoutDashboard' },
    { label: 'Inbox',           path: '/client/inbox',          icon: 'Mail' },
    { label: 'Onboarding',      path: '/client/onboarding',     icon: 'ClipboardList' },
    { label: 'My Project',      path: '/client/project',        icon: 'FolderOpen' },
    { label: 'Drafts & Review', path: '/client/drafts',         icon: 'Image' },
    { label: 'Invoices',        path: '/client/invoices',       icon: 'Receipt' },
    { label: 'Schedule',        path: '/client/schedule',       icon: 'Calendar' },
    { label: 'To-Do',           path: '/client/todo',           icon: 'ListChecks' },
    { label: 'Agreements',      path: '/client/agreements',     icon: 'ScrollText' },
  ],
  [ROLES.DESIGNER]: [
    { label: 'Dashboard',       path: '/designer',              icon: 'LayoutDashboard' },
    { label: 'Inbox',           path: '/designer/inbox',        icon: 'Mail' },
    { label: 'My Projects',     path: '/designer/projects',     icon: 'FolderKanban' },
    { label: 'Upload Drafts',   path: '/designer/upload',       icon: 'Upload' },
    { label: 'Timeline',        path: '/designer/timeline',     icon: 'CalendarDays' },
    { label: 'To-Do',           path: '/designer/todo',         icon: 'ListChecks' },
    { label: 'Earnings',        path: '/designer/earnings',     icon: 'DollarSign' },
    { label: 'Agreements',      path: '/designer/agreements',   icon: 'FileText' },
  ],
}

// ─── Daily motivational quote pool ───────────────────────────────────────────
export const QUOTE_POOL = [
  // Creativity & Design
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { text: "The details are not the details. They make the design.", author: "Charles Eames" },
  { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
  { text: "Creativity takes courage.", author: "Henri Matisse" },
  { text: "The most powerful person in the world is the storyteller.", author: "Steve Jobs" },
  { text: "Art enables us to find ourselves and lose ourselves at the same time.", author: "Thomas Merton" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { text: "Your vision will become clear only when you look into your heart. Who looks outside, dreams. Who looks inside, awakens.", author: "Carl Jung" },
  { text: "Make it simple, but significant.", author: "Don Draper" },

  // Business & Entrepreneurship
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Build something 100 people love, not something 1 million people kind of like.", author: "Paul Graham" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "Chase the vision, not the money. The money will end up following you.", author: "Tony Hsieh" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky" },
  { text: "Small businesses are the backbone of our economy and the backbone of our communities.", author: "Rod Blum" },
  { text: "A small business is an amazing way to serve and leave an impact on the world you live in.", author: "Nicole Snow" },
  { text: "Every day is a new opportunity to grow your business and yourself.", author: "Unknown" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },

  // Self-Belief & Confidence
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "She believed she could, so she did.", author: "R.S. Grey" },
  { text: "Nothing can dim the light which shines from within.", author: "Maya Angelou" },
  { text: "You were made to do hard things, so believe in yourself.", author: "Unknown" },
  { text: "Your story is what you have, what you will always have. It is something to own.", author: "Michelle Obama" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
  { text: "You have what it takes to make something great. You always have.", author: "Unknown" },
  { text: "Trust yourself. You know more than you think you do.", author: "Benjamin Spock" },

  // Resilience & Perseverance
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
  { text: "The comeback is always stronger than the setback.", author: "Unknown" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { text: "You don't have to see the whole staircase. Just take the first step.", author: "Martin Luther King Jr." },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hard days are the best because that's when champions are made.", author: "Gabby Douglas" },

  // Joy, Gratitude & Mindset
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The more you praise and celebrate your life, the more there is in life to celebrate.", author: "Oprah Winfrey" },
  { text: "Joy does not simply happen to us. We have to choose joy and keep choosing it.", author: "Henri Nouwen" },
  { text: "Start each day with a grateful heart.", author: "Unknown" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { text: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Robert Brault" },

  // Growth & Purpose
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "What you do makes a difference, and you have to decide what kind of difference you want to make.", author: "Jane Goodall" },
  { text: "Your work is going to fill a large part of your life. The only way to be truly satisfied is to do great work.", author: "Steve Jobs" },
  { text: "Don't watch the clock — do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Growth and comfort do not coexist.", author: "Ginni Rometty" },
  { text: "You don't find the happy life. You make it.", author: "Camilla Eyring Kimball" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },

  // Women & Empowerment
  { text: "A woman with a voice is, by definition, a strong woman.", author: "Melinda Gates" },
  { text: "Well-behaved women seldom make history.", author: "Laurel Thatcher Ulrich" },
  { text: "There is no limit to what we, as women, can accomplish.", author: "Michelle Obama" },
  { text: "I am not free while any woman is unfree, even when her shackles are very different from my own.", author: "Audre Lorde" },
  { text: "The question isn't who's going to let me; it's who is going to stop me.", author: "Ayn Rand" },
  { text: "Think like a queen. A queen is not afraid to fail. Failure is another stepping stone to greatness.", author: "Oprah Winfrey" },

  // Creative Confidence & Artistic Freedom
  { text: "If you hear a voice within you say, 'You cannot paint,' then by all means paint, and that voice will be silenced.", author: "Vincent van Gogh" },
  { text: "The worst enemy to creativity is self-doubt.", author: "Sylvia Plath" },
  { text: "Creativity requires the courage to let go of certainties.", author: "Erich Fromm" },
  { text: "If you're not prepared to be wrong, you'll never come up with anything original.", author: "Ken Robinson" },
  { text: "The chief enemy of creativity is good sense.", author: "Pablo Picasso" },
  { text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso" },
  { text: "Learn the rules like a pro, so you can break them like an artist.", author: "Pablo Picasso" },
  { text: "I found I could say things with color and shapes that I couldn't say any other way — things I had no words for.", author: "Georgia O'Keeffe" },
  { text: "Whether you succeed or not is irrelevant — there is no such thing. Making your unknown known is the important thing.", author: "Georgia O'Keeffe" },
  { text: "In order to be irreplaceable one must always be different.", author: "Coco Chanel" },

  // The Design Process & Creative Thinking
  { text: "Design is thinking made visual.", author: "Saul Bass" },
  { text: "I want to make beautiful things, even if nobody cares, as opposed to ugly things. That's my intent.", author: "Saul Bass" },
  { text: "There are three responses to a piece of design — yes, no, and WOW. Wow is the one to aim for.", author: "Milton Glaser" },
  { text: "Simplicity is not the goal. It is the by-product of a good idea and modest expectations.", author: "Paul Rand" },
  { text: "Design can be art. Design can be aesthetics. Design is so simple, that's why it is so complicated.", author: "Paul Rand" },
  { text: "If you can design one thing, you can design everything.", author: "Massimo Vignelli" },
  { text: "Good design is a language, not a style.", author: "Massimo Vignelli" },
  { text: "It's through mistakes that you actually can grow. You have to get bad in order to get good.", author: "Paula Scher" },
  { text: "Creativity involves breaking out of established patterns in order to look at things in a different way.", author: "Edward de Bono" },
  { text: "Art, freedom, and creativity will change society faster than politics.", author: "Victor Pinchuk" },

  // Bold Creativity & Taking Risks
  { text: "Creativity is inventing, experimenting, growing, taking risks, breaking rules, making mistakes, and having fun.", author: "Mary Lou Cook" },
  { text: "Vulnerability is the birthplace of love, belonging, joy, courage, empathy, and creativity.", author: "Brene Brown" },
  { text: "A creative life is an amplified life. It's a bigger life, a happier life, an expanded life, and a hell of a lot more interesting life.", author: "Elizabeth Gilbert" },
  { text: "Creative courage is the discovering of new forms, new symbols, new patterns on which a new society can be built.", author: "Rollo May" },
  { text: "In order to be open to creativity, one must have the capacity for constructive use of solitude.", author: "Rollo May" },
  { text: "An essential aspect of creativity is not being afraid to fail.", author: "Edwin Land" },
  { text: "Curiosity about life in all of its aspects, I think, is still the secret of great creative people.", author: "Leo Burnett" },
  { text: "Make it simple. Make it memorable. Make it inviting to look at. Make it fun to read.", author: "Leo Burnett" },
  { text: "Talent, I believe, is most likely to be found among nonconformists, dissenters, and rebels.", author: "David Ogilvy" },

  // Finding Your Creative Voice
  { text: "The one thing that you have that nobody else has is you. Your voice, your mind, your story, your vision.", author: "Neil Gaiman" },
  { text: "Start copying what you love. Copy copy copy copy. At the end of the copy you will find yourself.", author: "Austin Kleon" },
  { text: "You are, in fact, a mashup of what you choose to let into your life. You are the sum of your influences.", author: "Austin Kleon" },
  { text: "Inspiration exists, but it has to find you working.", author: "Pablo Picasso" },
  { text: "Have no fear of perfection — you'll never reach it.", author: "Salvador Dali" },
  { text: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf" },
  { text: "I am seeking. I am striving. I am in it with all my heart.", author: "Vincent van Gogh" },
  { text: "Creativity is allowing yourself to make mistakes. Art is knowing which ones to keep.", author: "Scott Adams" },
  { text: "The creative adult is the child who survived.", author: "Ursula K. Le Guin" },
  { text: "Do not fear mistakes. There are none.", author: "Miles Davis" },
]
