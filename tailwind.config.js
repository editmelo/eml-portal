/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',   // toggled by adding 'dark' class to PortalLayout wrapper
  theme: {
    extend: {
      colors: {
        // ── EML Brand ──────────────────────────────────────────────────────
        // brand-500 = EML Dark Blue (#124F9E)  →  primary buttons, links (white text ✓)
        // brand-400 = EML Cyan    (#47C9F3)    →  accent text/icons on dark backgrounds
        brand: {
          50:  '#edf7fd',
          100: '#d2ecfb',
          200: '#a8dbf7',
          300: '#6dc4f2',
          400: '#47C9F3',   // ← EML Cyan — accent on dark bg
          500: '#124F9E',   // ← EML Dark Blue — primary buttons
          600: '#0f4089',
          700: '#0c3272',
          800: '#092558',
          900: '#07101f',   // ← EML Darkest Navy — matches site bg
          950: '#040c16',
        },

        // ── Admin (Business) Portal — dark navy theme ──────────────────────
        admin: {
          bg:      '#07101f',   // EML darkest navy
          surface: '#0d1f3c',   // EML navy card surface
          border:  '#193561',   // subtle navy border
          accent:  '#47C9F3',   // EML cyan — glows, active states, icons
        },

        // ── Client Portal — clean light with EML blue accents ──────────────
        client: {
          bg:      '#f4f7fb',
          surface: '#ffffff',
          border:  '#dde5f0',
          accent:  '#124F9E',
        },

        // ── Designer Portal — matches client but violet-tinted ─────────────
        designer: {
          bg:      '#f4f7fb',
          surface: '#ffffff',
          border:  '#dde5f0',
          accent:  '#124F9E',
        },
      },

      fontFamily: {
        sans:    ['Open Sans', 'system-ui', 'sans-serif'],
        display: ['Open Sans', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        'card':     '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-md':  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        // Cyan glow — used on active elements in the dark admin portal
        'cyan-glow': '0 0 16px rgba(71, 201, 243, 0.30)',
        'blue-glow': '0 0 24px rgba(18,  79, 158, 0.35)',
      },
    },
  },
  plugins: [],
}
