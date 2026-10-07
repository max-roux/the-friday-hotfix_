# The Friday Hotfix_

Patch notes for our data brains. A one-page site styled as a git repository. Full spec: [`docs/SPEC.md`](docs/SPEC.md).

## Stack

- [Astro](https://astro.build) + TypeScript (static output)
- Content collections (one Markdown file per edition)
- Plain CSS + vanilla TypeScript progressive enhancement

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
npm test
```

## Content

Add editions under `src/content/editions/` as frontmatter-only Markdown files. See existing `2026-w*.md` for the schema.

## Config

Copy `.env.example` to `.env` and set:


| Variable                         | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`                | Canonical URL, Slack "Follow:" line, RSS and release links (**required** for `npm run build`) |
| `PUBLIC_LINKEDIN_URL`            | Blame section link                                                      |
| `PUBLIC_LINKEDIN_NEWSLETTER_URL` | Follow → linkedin (falls back to the profile)                           |
| `PUBLIC_GITHUB_URL`              | Follow → github releases                                                |

## Delivery

- **LinkedIn newsletter**: posted by hand; start from an edition's "copy for slack" text.
- **RSS**: `/rss.xml`, built with the site.
- **GitHub releases**: `.github/workflows/release.yml` creates a release per new edition on pushes to `main`, using `/releases/{version}.md` from the build. Set `PUBLIC_SITE_URL` as an Actions variable (Settings → Secrets and variables → Actions → Variables).
