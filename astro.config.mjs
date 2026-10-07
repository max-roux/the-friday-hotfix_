// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');

/** Accepts `example.com`, `https://example.com/` or a quoted value; fails with a clear message otherwise. */
function normalizeSiteUrl(raw) {
  if (!raw) return undefined;
  let value = raw.trim().replace(/^['"]|['"]$/g, '').trim();
  if (!value) return undefined;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`PUBLIC_SITE_URL is not a valid URL: "${raw}". Use e.g. https://thefridayhotfix.com`);
  }
}

// https://astro.build/config
export default defineConfig({
  site: normalizeSiteUrl(PUBLIC_SITE_URL),
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
