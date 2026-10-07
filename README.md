# The Friday Hotfix_

Patch notes for your data brain. A one-page site styled as a git repository.

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
```

## Content

Add editions under `src/content/editions/` as frontmatter-only Markdown files. See existing `2026-w*.md` for the schema.

## Config

Copy `.env.example` to `.env` and set:


| Variable               | Purpose                              |
| ---------------------- | ------------------------------------ |
| `PUBLIC_SITE_URL`      | Canonical URL + Slack subscribe line |
| `PUBLIC_LINKEDIN_URL`  | Blame section link                   |
| `PUBLIC_SUBSCRIBE_URL` | Newsletter provider POST endpoint    |


Until `PUBLIC_SUBSCRIBE_URL` is set, subscribe succeeds locally (use `*@fail.test` to simulate a network error).