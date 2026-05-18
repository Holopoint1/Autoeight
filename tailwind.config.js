/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,md}'],
  // preflight disabled in astro.config.mjs (applyBaseStyles: false) — the
  // existing /style.css owns the reset and design system. Tailwind here is
  // additive only, mapped onto the existing CSS custom properties so new
  // markup stays visually consistent with the legacy stylesheet.
  theme: {
    extend: {
      colors: {
        purple: 'var(--purple, #7c5cfc)',
        muted: 'var(--muted, #71717a)',
        border: 'var(--border, #e4e4e7)',
        surface: 'var(--surface, #f4f4f5)',
        body: 'var(--body, #3f3f46)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
