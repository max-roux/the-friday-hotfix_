/** Placeholders from §8 — override with PUBLIC_* env vars when ready. */
export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL ?? 'https://fridayhotfix.example';

export const LINKEDIN_URL =
  import.meta.env.PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/in/maxime-roux-pro/';

export const SITE_TITLE =
  'The Friday Hotfix · patch notes for our data brains';

export const SITE_INTRO_LEAD = 'Patch notes for our data brains.';
export const SITE_INTRO_TOPICS = 'Platforms, BI and practical AI';
export const SITE_INTRO_SHIPPED = 'Shipped every Friday.';

export const SITE_DESCRIPTION = `${SITE_INTRO_LEAD} ${SITE_INTRO_TOPICS}. ${SITE_INTRO_SHIPPED}`;
