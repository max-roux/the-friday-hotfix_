/** From `site` in astro.config.mjs (set via PUBLIC_SITE_URL). */
if (import.meta.env.PROD && !import.meta.env.SITE) {
  throw new Error('PUBLIC_SITE_URL must be set for production builds (canonical, OG and Slack URLs).');
}
export const SITE_URL = import.meta.env.SITE ?? 'http://localhost:4321';

export const LINKEDIN_URL =
  import.meta.env.PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/in/maxime-roux-pro/';

/** Follow channels (§5.7 / §5.9). The newsletter falls back to the profile until it exists. */
export const LINKEDIN_NEWSLETTER_URL =
  import.meta.env.PUBLIC_LINKEDIN_NEWSLETTER_URL || LINKEDIN_URL;
export const GITHUB_URL =
  import.meta.env.PUBLIC_GITHUB_URL || 'https://github.com/max-roux/thefridayhotfix';

export const SITE_TITLE =
  'The Friday Hotfix · patch notes for our data brains';

export const SITE_INTRO_LEAD = 'Patch notes for our data brains.';
export const SITE_INTRO_TOPICS = 'Platforms, BI and practical AI';
export const SITE_INTRO_SHIPPED = 'Shipped every Friday.';

export const SITE_DESCRIPTION = `${SITE_INTRO_LEAD} ${SITE_INTRO_TOPICS}. ${SITE_INTRO_SHIPPED}`;
