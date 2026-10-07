// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL || undefined,
  trailingSlash: 'never',
  // Downloaded at build time and served from our own origin (no Google request from visitors).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex',
      weights: [400, 500, 600],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
