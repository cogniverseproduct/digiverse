import colors from 'tailwindcss/colors';

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
/** Stock Tailwind scale, but every shade reads a --c-<name>-<shade> variable (fallback = stock colour). */
const themed = (name) =>
  Object.fromEntries(Object.entries(colors[name]).map(([shade, hex]) => [shade, `rgb(var(--c-${name}-${shade}, ${toRgb(hex)}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: themed('indigo'),
        violet: themed('violet'),
        purple: themed('purple'),
        fuchsia: themed('fuchsia'),
        cyan: themed('cyan'),
        sky: themed('sky'),
        // DigiVerse main-product light design system ("Prism Paper")
        dv: {
          canvas: "rgb(var(--c-canvas, 246 245 250) / <alpha-value>)",
          paper: "#FFFFFF",
          mist: "rgb(var(--c-mist, 238 237 246) / <alpha-value>)",
          ink: "rgb(var(--c-ink, 18 18 42) / <alpha-value>)",
          "ink-2": "rgb(var(--c-ink-2, 58 58 86) / <alpha-value>)",
          muted: "rgb(var(--c-muted, 107 107 136) / <alpha-value>)",
          line: "rgb(var(--c-line, 230 228 239) / <alpha-value>)",
          coral: "rgb(var(--c-coral, 255 107 74) / <alpha-value>)",
          aqua: "rgb(var(--c-aqua, 18 181 166) / <alpha-value>)",
          sun: "rgb(var(--c-sun, 245 179 62) / <alpha-value>)",
          iris: {
            50: "rgb(var(--c-iris-50, 242 240 255) / <alpha-value>)",
            100: "rgb(var(--c-iris-100, 229 225 255) / <alpha-value>)",
            200: "rgb(var(--c-iris-200, 204 197 255) / <alpha-value>)",
            300: "rgb(var(--c-iris-300, 170 159 255) / <alpha-value>)",
            400: "rgb(var(--c-iris-400, 135 118 251) / <alpha-value>)",
            500: "rgb(var(--c-iris-500, 103 80 242) / <alpha-value>)",
            600: "rgb(var(--c-iris-600, 86 64 222) / <alpha-value>)",
            700: "rgb(var(--c-iris-700, 71 50 184) / <alpha-value>)",
            800: "rgb(var(--c-iris-800, 58 42 147) / <alpha-value>)",
            900: "rgb(var(--c-iris-900, 44 33 112) / <alpha-value>)",
          },
        },
        cultural: {
          ivory: "#FDFBF7",
          cream: "#F9F6F0",
          sand: "#F3EFE6",
          parchment: "#EFE8DA",
          red: "#B91C1C",
          vermilion: "#DC2626",
          marigold: "#EA580C",
          gold: "#D97706",
          amber: "#F59E0B",
          navy: "#0F172A",
          charcoal: "#1C1917",
          stone: "#44403C",
          muted: "#78716C",
          border: "rgba(28, 25, 23, 0.1)",
          "border-warm": "rgba(217, 119, 6, 0.25)",
        },
        digiverse: {
          bg: "#0B0F19",
          surface: "#111827",
          "surface-light": "#1A2234",
          charcoal: "#1F2937",
          border: "rgba(255, 255, 255, 0.08)",
          "border-highlight": "rgba(99, 102, 241, 0.3)",
          indigo: "#6366F1",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          text: "#F3F4F6",
          muted: "#9CA3AF"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        bengali: ['"Hind Siliguri"', 'Inter', 'system-ui', 'sans-serif'],
        'bengali-serif': ['"Noto Serif Bengali"', 'Georgia', 'serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm-glow': '0 10px 30px -10px rgba(220, 38, 38, 0.15), 0 0 1px 1px rgba(217, 119, 6, 0.2)',
        'gold-glow': '0 10px 30px -10px rgba(217, 119, 6, 0.2), 0 0 1px 1px rgba(217, 119, 6, 0.3)',
        'festive-card': '0 4px 20px -2px rgba(28, 25, 23, 0.06), 0 0 1px 1px rgba(28, 25, 23, 0.08)',
        'dv-card': '0 1px 2px rgba(18,18,42,0.04), 0 8px 24px -14px rgba(18,18,42,0.12)',
        'dv-lift': '0 2px 6px rgba(18,18,42,0.05), 0 28px 56px -24px rgba(71,50,184,0.28)',
        'dv-glow': '0 12px 32px -12px rgba(103,80,242,0.6)',
        'dv-float': '0 30px 80px -30px rgba(18,18,42,0.35), 0 0 0 1px rgba(18,18,42,0.04)',
      },
      keyframes: {
        'dv-rise': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'dv-fade': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'dv-pop': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'dv-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'dv-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%, -6%, 0) scale(1.06)' },
          '66%': { transform: 'translate3d(-5%, 4%, 0) scale(0.96)' },
        },
        'dv-marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'dv-shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'dv-progress': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
        'dv-slide-in': { '0%': { opacity: '0', transform: 'translateX(40px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'dv-rise': 'dv-rise 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'dv-fade': 'dv-fade 0.5s ease-out both',
        'dv-pop': 'dv-pop 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'dv-float': 'dv-float 6s ease-in-out infinite',
        'dv-float-slow': 'dv-float 9s ease-in-out infinite',
        'dv-drift': 'dv-drift 22s ease-in-out infinite',
        'dv-marquee': 'dv-marquee 40s linear infinite',
        'dv-shimmer': 'dv-shimmer 2.4s linear infinite',
        'dv-progress': 'dv-progress 1.4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
