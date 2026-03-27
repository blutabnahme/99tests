import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        'primary': '#008085',
        'primary-light': '#80C0C2',
        'primary-dark': '#005C5F',

        // Neutrals
        'near-black': '#1A1D23',
        'gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#C8CCD4',
          400: '#9CA3AF',
          500: '#6E7280',
          700: '#4A4E58',
        },

        // Semantic
        'success': '#16A34A',
        'warning': '#D97706',
        'error': '#DC2626',
        'info': '#2563EB',

        // Semantic backgrounds
        'success-bg': '#F0FDF4',
        'warning-bg': '#FFF7ED',
        'error-bg': '#FEF2F2',
        'info-bg': '#EFF6FF',
        'matched-bg': '#E6F5F5',
        'open-bg': '#FEF0F2',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Swiza', 'Space Grotesk', 'sans-serif'],
        body: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['36px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '500' }],
        'h2': ['28px', { lineHeight: '1.25', letterSpacing: '-0.3px', fontWeight: '500' }],
        'h3': ['20px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '500' }],
        'h4': ['16px', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-bold': ['14px', { lineHeight: '1.6', fontWeight: '500' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'tiny': ['11px', { lineHeight: '1.4', letterSpacing: '0.2px', fontWeight: '500' }],
        'mono': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'mono-sm': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'badge': '4px',
        'tooltip': '6px',
        'card': '8px',
        'dropdown': '8px',
        'modal': '16px',
        'pill': '999px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.04)',
        'sm': '0 1px 3px rgba(0,0,0,0.04)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 12px 24px rgba(0,0,0,0.1)',
        'xl': '0 24px 48px rgba(0,0,0,0.12)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.4" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 200ms ease-out forwards",
        "ticker": "ticker 35s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
export default config
