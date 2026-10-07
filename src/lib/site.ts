/** Placeholders from §8 — override with PUBLIC_* env vars when ready. */
export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL ?? 'https://fridayhotfix.example';

export const LINKEDIN_URL =
  import.meta.env.PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/in/';

export const SITE_TITLE =
  'The Friday Hotfix · patch notes for your data brain';

export const SITE_DESCRIPTION =
  'Patch notes for your data brain. Platforms, BI and practical AI. Shipped every Friday.';
