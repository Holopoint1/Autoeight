import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Track A/B for Cloudflare Pages — static output, no host backend.
// Dynamic logic (chat, tracking, admin auth) is external Supabase Edge Functions,
// so there is NO Astro/Pages SSR adapter and NO D1/KV/R2.
export default defineConfig({
  site: 'https://autoeight.ai',
  output: 'static',

  // Emit `privacy.html` (not `privacy/index.html`). Cloudflare Pages then
  // serves it at the clean URL `/privacy` and 301s `/privacy.html` -> `/privacy`,
  // which is exactly what the existing canonical URLs already expect. This is
  // how the old URLs are preserved 1:1 with no redirect map needed.
  build: { format: 'file' },

  integrations: [
    tailwind({
      // The site already has a full reset + design system in /style.css.
      // Tailwind's preflight would re-reset and visibly change the live look,
      // so it is disabled. Tailwind utilities are available additively.
      applyBaseStyles: false,
    }),
    // NOTE: @astrojs/sitemap is intentionally NOT used — its v3 build:done
    // hook crashes with `build.format:'file'` (the format that preserves the
    // live .html→clean URL mapping). The static public/sitemap.xml is kept
    // instead and stays valid because every URL is unchanged 1:1. Automating
    // the sitemap is a deferred follow-up (see docs/MIGRATION.md).
  ],
});
