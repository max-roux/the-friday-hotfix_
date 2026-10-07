# The Friday Hotfix: build spec (v2)

## What changed since v1

1. **No email.** The subscribe form and the newsletter provider are gone. They're replaced by a fake-terminal "follow" prompt that sends people to LinkedIn, RSS or GitHub (§5.7).
2. **Delivery channels:** a LinkedIn newsletter (main), an RSS feed, and GitHub releases (§5.9). RSS moves from "later" to v1.
3. **Logo and icons.** Logo A (the hotfix branch merging into a red dot with a flame inside) is used in the header, as the favicon and app icons, and in the HEAD commit (§4.6, §5.10). The files live in `public/` (from `friday-hotfix-icons.zip`).
4. **Edition mood.** New `mood` field per edition. The HEAD commit dot shows the flame with that mood's face, plus a `mood: …` label (§3, §5.10).
5. **Title typing with a typo.** It types "The Fredag H", deletes back to "The Fr", then types the rest of "Friday Hotfix". There's no flash of the full title before it starts, it finishes in under ~3s, and the cursor stays solid while typing (§5.1).
6. **404 page** in the same style (§4.7).
7. **Footer sign-off:** a tiny flame dot after `EOF` (§4.5).
8. Nav and bio labels change from "subscribe" to "follow"; the Slack copy ends with "Follow: {SITE_URL}" (§5.5).

This document is the full spec with those changes folded in, and synced with what's built (tokens, copy, header).

---

A one-page website for **The Friday Hotfix**, a weekly data newsletter by Max Roux: "patch notes for our data brains". The whole site is styled as a git repository: a README intro, editions shown as commits in a `git log --graph`, the author bio under `git blame`.

Design direction: **Scandinavian minimalist meets git.** One monospace typeface, one narrow column, hairlines instead of boxes, almost no colour. Colour is used only where git uses it (diff green and red) plus a single accent that means "now" (HEAD) and is also the logo's dot.

---

## 1. Stack

- **Astro + TypeScript**, fully static output. Content is pre-rendered HTML; JavaScript is only progressive enhancement.
- **Content collections**: one file per edition (see §3).
- **Plain CSS** with custom properties for tokens. No CSS framework.
- **Vanilla TypeScript** for interactivity (one small client script). No UI framework.
- Deploy to any static host (Vercel, Netlify, Cloudflare Pages).

**Rule: the page must be fully readable with JavaScript off.** Without JS, every edition renders expanded, all filters are hidden, the title shows in full, and the follow prompt (plain links) works.

---

## 2. Design tokens

```css
:root {
  /* colour: crisp, closest to a code editor */
  --paper:        #FFFFFF;  /* page background */
  --ink:          #1B1D1F;  /* primary text, buttons, filled dots */
  --text-2:       #3A3D40;  /* body paragraphs */
  --muted:        #5F6368;  /* meta text, labels, secondary lines */
  --hairline:     #E6E6E6;  /* dividers, graph track */
  --border:       #D4D4D4;  /* unselected chip / button borders */
  --row-active:   #F2F2F2;  /* keyboard-selected item background */
  --field:        #F2F2F2;  /* textarea background */
  --accent:       #B8322F;  /* HEAD dot + label, logo dot. Nothing else. */
  --diff-add:     #2F6B4F;  /* (+) in diff stat, success messages */
  --diff-del:     #A33A2E;  /* (−) in diff stat, error messages */
  --dialog-muted: #B9BCBF;  /* secondary text inside the dark shortcuts card */

  /* type */
  --font: 'IBM Plex Mono', ui-monospace, monospace;  /* weights 400, 500, 600 */
  --fs-base: 15px;   --lh-base: 1.7;
  --fs-small: 13px;  /* meta, labels, buttons, footer */
  --fs-nav: 14px;
  --fs-topic: 12px;

  /* layout */
  --col: 720px;      /* max content width */
  --gutter: 24px;    /* side padding, all breakpoints */
  --radius: 4px;     /* buttons, inputs; dialog uses 6px */
}
```

Type scale:

| Element | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| H1 (site title, 404) | `clamp(40px, 7vw, 64px)` | 500 | -0.04em | 1.05 |
| H2, latest edition title | 28px | 500 | -0.02em | 1.25 |
| H2, older edition titles | 17px | 500 | -0.02em | 1.25 |
| Body | 15px | 400 | 0 | 1.7 |
| Meta / labels / buttons | 13px | 400 | 0 | 1.7 |

Accessibility constraints: every interactive element has a hit area of at least **44×44px**. Text contrast is at least 4.5:1 (all tokens above pass on `--paper`; don't introduce lighter greys).

---

## 3. Content model

One file per edition: `src/content/editions/2026-w41.md` (frontmatter only; no body needed).

```yaml
version: v2026.41          # tag shown in the graph; also the anchor id and route
date: 2026-10-09           # always a Friday
title: "[Edition title]"
mood: shipped              # shipped | hype-detected | merge-conflict | friday (optional)
items:
  - kind: new              # new | fixed | known | deprecated
    topic: platform        # platform | bi | ai
    title: "[Headline]"
    take: "[One-line take: why it matters, and for whom.]"
    url: https://example.com/article
  - kind: fixed
    topic: bi
    title: "..."
    take: "..."
    url: "..."
prod: "[A lesson from building the platform this week: what we tried, what broke, what we'd do again.]"
stats:
  changed: "4 links changed"
  plus: "1 opinion(+)"
  minus: "37 hype posts(−)"
```

Derived at build time:

- **hash**: first 7 hex characters of SHA-1 of `version` (stable, looks like a commit hash).
- **HEAD**: the edition with the latest `date`.
- **Item order** within an edition: grouped by kind in this order: `new`, `fixed`, `known`, `deprecated`. Keep file order inside each group.
- **Item id**: `${version}-${kind}-${n}`, where n is the 1-based position within that kind, e.g. `v2026.41-new-1`.

Kind labels (exact strings):

| kind | label | label colour | title style |
|---|---|---|---|
| new | `+ new` | ink | normal |
| fixed | `✓ fixed` | ink | normal |
| known | `! known` | ink | normal |
| deprecated | `− deprecated` | muted | muted + `line-through` |

Moods (face drawn inside the flame, §5.10):

| mood | face | when |
|---|---|---|
| `shipped` | round eyes, smile | a good week, things landed |
| `hype-detected` | angry brows, flat mouth | the week was mostly launch noise |
| `merge-conflict` | `> <` eyes, wavy mouth | something broke / contested news |
| `friday` | sunglasses, smile | light week, enjoy the weekend |

`mood` is only shown on HEAD. If it's missing, HEAD falls back to a plain accent dot and no label.

---

## 4. Page structure and exact copy

All sections share one centered column: `max-width: 720px; margin: 0 auto; padding-inline: 24px`.

### 4.1 Header (padding 28px top/bottom)
- Left: link to `#top` (min-height 44px, 13px): Logo A mark (24×24, inline SVG so it uses the tokens, `aria-hidden`), then `<muted>max-roux/</muted><600>the-friday-hotfix_</600>`.
- Right nav (14px, gap 24px): `log` → `#log`, `blame` → `#blame`, `follow` → `#follow`. No underlines.
- On pages other than the home and edition routes (the 404), every link is prefixed with `/` (`/#top`, `/#log`, …).

### 4.2 Hero / README (`#top`, padding 112px top, 80px bottom)
- Label: `README.md` (13px, muted)
- H1: `The Friday Hotfix` followed by a `_` cursor in ink (see §5.1). Margin-top 20px.
- Intro (text-2, max-width 560px, margin-top 32px), two lines: `Patch notes for our data brains. Platforms, BI and practical AI.` / `Shipped every Friday.`
- Follow prompt (§5.7), `id="follow"`, margin-top 48px.
- Footnote (13px, muted, margin-top 16px): `fridays · ~5 min · unfollow = git remote remove friday`

### 4.3 Log (`#log`, padding 48px top, 80px bottom)
- Label: `$ git log --graph` (13px, muted)
- Controls row (margin 20px 0 48px, wraps on mobile):
  - Left, `role="group" aria-label="Filter by topic"`: chips `--grep=*`, `--grep=platform`, `--grep=bi`, `--grep=ai`
  - Right (margin-left: auto): toggle `--oneline`, square `?` button (aria-label "Keyboard shortcuts")
  - All 44px tall, 1px border, radius 4px, 13px mono. Selected state: ink background, paper text, ink border. Unselected: transparent, ink text, `--border` border. Use `aria-pressed`.
- Commit graph (§5.8) containing one `<article id="{version}">` per edition, newest first, then a final static root commit:
  `0d0d0d0  initial commit: "how hard can a weekly newsletter be?"` (13px, muted)

**Edition anatomy:**
1. Header button (full width, min-height 44px, transparent, left-aligned, 13px muted, `aria-expanded`): `{hash}` · `{label}` · `{date as "Fri 9 Oct 2026"}` · (HEAD with a mood only) `mood: {mood}` · right-aligned `[−]` or `[+]`.
   - HEAD label: `(HEAD -> main, tag: v2026.41)`, accent colour, weight 600.
   - Others: `tag: v2026.40`, muted, weight 400.
   - The `mood: …` label is muted, weight 400 (the accent stays reserved for HEAD itself).
2. H2 title (margin-top 2px).
3. When expanded:
   - Item list (margin-top 24px, top border hairline). Each item row: flex, wraps; padding 14px 12px with -12px side margins so the highlight bleeds; bottom border hairline.
     - Left column (120px): kind label, and under it the topic `[platform]` (12px, muted).
     - Right column (flex 1 1 360px): title as a link to `url` + ` ↗` (weight 500); a permalink `#` (13px, muted, aria-label "Permalink to this item") right-aligned on the same line; the take beneath (muted).
   - If the filter leaves no items: one row `no items match --grep={topic} in this edition` (muted).
   - `// from my prod` (muted) + prod paragraph (text-2), margin-top 28px.
   - Diff stat (13px, muted, margin-top 24px): `{changed}, <diff-add>{plus}</diff-add>, <diff-del>{minus}</diff-del>`
   - Actions (margin-top 24px, 13px): button `copy for slack` (44px, 1px ink border, transparent) and link `permalink #` → `#{version}` (muted).
4. Bottom padding: 72px if expanded, 32px if collapsed.

### 4.4 Blame (`#blame`, padding 48px top, 96px bottom)
- Label: `$ git blame` (13px, muted)
- `<500>Max Roux</500> <muted>&lt;Head of Data, Samsøe Samsøe&gt;</muted>`
- Bio (text-2): `Writing from Copenhagen. Wraps up the week's data news just in time for your Friday breakfast. I hope you enjoy writing it with a croissant and a cappuccino. The only one to blame for this page.`
- Links (14px, gap 24px): `linkedin ↗` → LinkedIn profile, `follow ↗` → `#follow`

### 4.5 Footer (top border hairline; padding 32px top, 48px bottom; 13px muted; space-between, wraps)
- Left: `merged into main. no tests were run.`
- Right: `press ? for shortcuts · EOF` then a 12×12 flame dot (`/brand/dot-shipped.svg`, `alt=""`), 6px gap, vertically centred with the text. `press ? for shortcuts · ` is hidden on touch-only devices (`hover: none`) and on the 404.

### 4.6 Logo and icons
Logo A: a vertical branch line with a hotfix branch curving out and merging back, meeting at a red dot (`--accent`) with a white flame inside. Files (in `public/`):

| File | Use |
|---|---|
| `favicon.ico` (16/32/48), `favicon.svg` | browser tab; the SVG flips the strokes to paper in dark mode |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | legacy favicons |
| `apple-touch-icon.png` (180) | iOS home screen |
| `icon-192.png`, `icon-512.png` + `site.webmanifest` | Android / PWA |
| `brand/logo-mark.svg`, `brand/logo-mark-on-dark.svg` | mark on its own (header uses an inline copy) |
| `brand/logo-wordmark.svg`, `brand/logo-tile.svg` | mark + "The Friday Hotfix_", square tile (social, LinkedIn newsletter cover) |
| `brand/avatar-light.svg`, `brand/avatar-dark.svg` | profile avatar |
| `brand/dot-{mood}.svg` | the HEAD commit dot, one per mood (§5.10); `dot-shipped.svg` is also the footer sign-off |

### 4.7 404 (`/404`, served by the host for unknown paths)
Same header (with `/`-prefixed links, §4.1) and footer (without the shortcuts hint). One section with the hero's spacing:
- Label (13px, muted): `$ git checkout {path}`
- H1: `404` followed by the blinking `_` cursor (no typing).
- Error line (15px, diff-del, margin-top 32px, breaks anywhere): `error: pathspec '{path}' did not match any file(s) known to git`
- Body (text-2, margin-top 16px): `This page was reverted, renamed or never merged. Nothing to hotfix here.`
- Actions (margin-top 48px, gap 12px, wraps): `git checkout main ↵` → `/` (ink background, paper text, 44px, radius 4px) and `git log` → `/#log` (outlined chip).
- `{path}` is `location.pathname`, filled in by a tiny inline script with `textContent`. Without JS it reads `this-page`.

---

## 5. Behaviours

### 5.1 Typing title (first visit only)
- On the visitor's first page load, after a **200ms** delay, type `The Fredag H` (one character every **70ms**), pause **500ms**, delete back to `The Fr` (6 characters, **40ms** each), then type `iday Hotfix` (70ms each). Total ≈ 2.55s; it must stay under ~3s. The `_` cursor sits right after the typed text.
- **No flash:** an inline script in `<head>` decides before first paint whether the title will type (adds `html.title-will-type`); CSS keeps the title empty until the typing starts. On visits where it won't type, the full title is there from the first paint.
- **Cursor:** solid (no blink) while typing and deleting; once done it blinks: `@keyframes blink { 0%,49% {opacity:1} 50%,100% {opacity:0} }`, 1s, `steps(1)`, infinite.
- Mark the visit in `localStorage['fh-title-typed'] = '1'` when typing finishes. On later visits show the full title immediately. `?retype` forces it again; on `localhost` it types every time (dev convenience).
- Accessibility: the H1 contains a visually hidden full title; the animated text + cursor is `aria-hidden="true"`.
- `prefers-reduced-motion: reduce` → no typing, full title immediately, no blink.
- Wrap every `localStorage` access in try/catch; if storage fails, type every time.
- Reserve the H1 height (`min-height: 1.05em`) so nothing shifts while typing.

### 5.2 `--oneline` toggle
- Off by default. When on, hide every item's take, the `// from my prod` block and the diff stat, in all editions. Titles, kinds and topics stay.
- Keyboard shortcut `o` toggles it.

### 5.3 Topic filters (`--grep`)
- Single-select; `--grep=*` (all) is the default.
- Filters items in every edition. Selecting a filter resets the keyboard selection (§5.6).
- Sync to the URL: `?grep=ai` (use `history.replaceState`), and read it on load so filtered views can be shared.

### 5.4 Expandable editions
- HEAD starts expanded; all others collapsed.
- Clicking an edition's header button toggles it.
- If the page loads with a hash pointing to an edition or item (`#v2026.39` or `#v2026.39-known-1`), expand that edition, then scroll to the target.
- No-JS fallback: all editions expanded and header buttons inert.

### 5.5 Copy for Slack
Copies the whole edition (ignoring the current filter) as plain text in exactly this format:

```
The Friday Hotfix · v2026.41 · Fri 9 Oct 2026
[Edition title]

+ new  [Headline]
    [take]
    https://…

✓ fixed  [Headline]
    [take]
    https://…

// from my prod
[prod paragraph]

Follow: {SITE_URL}
```

- On success the button label becomes `✓ copied. paste it in slack` for 2.5s, then reverts.
- If `navigator.clipboard.writeText` is unavailable or rejects, show a labelled `<textarea>` under the button with the text pre-filled: label `copying is blocked here. select the text and copy it yourself:` (13px muted). Textarea: 12 rows, full width, 1px `--border`, radius 4px, `--field` background.

### 5.6 Keyboard shortcuts
- One `keydown` listener on `document`. Ignore events when focus is in an input or textarea, or when any of Cmd, Ctrl or Alt is held.
- `j` / `k`: move a selection through the **visible** items of **expanded** editions, in page order, clamped at both ends. The selected row gets the `--row-active` background, is scrolled to the vertical centre (smooth scrolling, instant under reduced motion), and its title link receives focus (`preventScroll: true`), so `enter` opens it natively.
- `o`: toggle `--oneline`.
- `?`: open or close the shortcuts card. `esc`: close it.
- Shortcuts card: native `<dialog>` (modal), `aria-label="Keyboard shortcuts"`, fixed bottom-right (24px inset), 300px wide (max: 100% − 48px), ink background, paper text, radius 6px, 13px, line-height 2. Header: `$ man hotfix` (dialog-muted) plus a 44px close button `×`. Rows (key left, description right in dialog-muted):
  - `j / k` · next / previous item
  - `enter` · open selected link
  - `o` · toggle --oneline
  - `?` · show / hide this
  - `esc` · close
- Focus moves into the card when it opens and back to the trigger when it closes.

### 5.7 Follow prompt
Replaces the v1 email form. No email is collected anywhere on the site.

- Container `id="follow"`: top and bottom hairline borders, padding 6px 0, flex row that wraps, gap 12px 16px, `role="group"` labelled by the prompt.
  - Prompt (13px, muted, 44px tall): `$ git remote add friday`
  - Three links, each 44px tall, radius 4px, 13px mono, padding 0 14px:
    - `linkedin ↗` → LinkedIn newsletter (main channel): ink background, paper text.
    - `rss` → `/rss.xml`: transparent, ink text, 1px `--border`.
    - `github ↗` → `{GITHUB_URL}/releases`: same as rss.
  - External links open in a new tab (`rel="noopener noreferrer"`). They're plain links, so the prompt works without JS.
- Hint line under the prompt (13px, muted, min-height 1.7em, margin-top 8px), fake terminal output. Default: `pick a remote. same patch notes on all three.` On hover or focus of a link it shows that link's hint, and reverts on leave / blur:
  - linkedin: `→ linkedin newsletter. lands in your feed every friday.`
  - rss: `→ /rss.xml. for people who still own a feed reader (respect).`
  - github: `→ github releases. watch → custom → releases.`
- The hint line is not a live region (it would be noise for screen readers); the link text alone is enough.

### 5.8 Commit graph fills on scroll
Geometry:
- Graph container: `position: relative; padding-left: 40px`.
- Track: absolute, `left: 6px; top: 10px; bottom: 10px; width: 1px; background: var(--hairline)`.
- Fill: same position and width, `background: var(--ink)`, `height: {fill}px`.
- Dots: 13×13px circles, `box-sizing: border-box`, positioned `left: -40px; top: 6px` relative to each edition article (the root commit dot uses `top: 7px`).
  - HEAD: the mood dot (§5.10), or a plain accent dot without a mood. Always; never changes with scroll.
  - Others: 1px ink border; background is paper until passed, then ink; `transition: background-color 240ms ease`.

Algorithm (run on load, on `scroll` with capture, on `resize`, and after any expand/collapse or filter change; throttle with `requestAnimationFrame`, with a 32ms timeout fallback):

```ts
const r = graph.getBoundingClientRect();
const lineTop = 10;
const lineH = Math.max(0, r.height - 20);
const mid = window.innerHeight * 0.5;
const fill = reducedMotion ? lineH
  : clamp(Math.round(mid - (r.top + lineTop)), 0, lineH);

// a dot is "passed" when the fill reaches its centre,
// or when the fill is complete (so the root dot fills at the end)
passed(el) = fill >= lineH - 1 || (el.top - r.top + 6 - lineTop) <= fill;
```

- Only write to the DOM when the values change.
- No-JS and reduced-motion: line fully drawn, all dots filled.

### 5.9 Delivery channels
Every edition goes out on three channels. The site is the source of truth; each channel links back to `{SITE_URL}/{version}`.

1. **LinkedIn newsletter (main).** Posted by hand each Friday. The "copy for slack" text (§5.5) is the starting draft; cover image from `brand/logo-tile.svg`.
2. **RSS** at `/rss.xml` (RSS 2.0, generated at build time, no dependency). Channel title `The Friday Hotfix`, link `{SITE_URL}`, description = site description, `language en`. One `<item>` per edition, newest first:
   - `title`: `{version} · {title}`
   - `link` and `guid` (`isPermaLink="true"`): `{SITE_URL}/{version}`
   - `pubDate`: the edition date (RFC 822, UTC)
   - `description`: escaped HTML: the items as a list (`{label} <a href={url}>{title}</a>: {take}`), then `// from my prod` and the prod paragraph.
   - Every page has `<link rel="alternate" type="application/rss+xml" title="The Friday Hotfix" href="/rss.xml">`.
3. **GitHub releases.** The build also emits `/releases/{version}.md` (release notes in Markdown). A GitHub Action (`.github/workflows/release.yml`) runs on pushes to `main` that touch `src/content/editions/**`: it builds the site and, for every edition without a release yet, creates a release with tag `{version}`, title `{version} · {title}`, notes from that file. Readers follow by watching the repo with "Releases only". Release notes format:

```
**[Edition title]**

- `+ new` [Headline](https://…) `[platform]`: [take]
- `✓ fixed` [Headline](https://…) `[bi]`: [take]

> // from my prod
> [prod paragraph]

4 links changed, 1 opinion(+), 37 hype posts(−)

Read it on the site: {SITE_URL}/{version}
```

### 5.10 Edition mood (HEAD dot)
- The HEAD dot is `/brand/dot-{mood}.svg`: the accent circle with the white flame and that mood's face. It renders at 30×30, centred on the same point as a 13px dot (`left: -48.5px; top: -2.5px`), so the graph line still runs through its centre. Decorative (`alt=""`); the `mood: …` label in the edition header (§4.3) carries the meaning.
- Only HEAD shows a mood. Older editions keep the plain dots, even if their file has a `mood`.

---

## 6. Responsive

- Single column at every width; side padding is always 24px.
- Item rows: the 120px kind column and the content column wrap naturally; below ~520px the kind and topic sit above the title.
- The controls row wraps: chips on the first line, `--oneline` and `?` on the next, right-aligned.
- The follow prompt wraps: prompt on the first line, the three links on the next.
- Edition header buttons wrap their meta parts onto two lines if needed.
- No horizontal scrolling at 320px width.

---

## 7. SEO, sharing, performance

- `<title>`: `The Friday Hotfix · patch notes for our data brains`. Meta description and Open Graph tags.
- Static route per edition (`/v2026.41`) that renders the same page with that edition expanded and scrolled to, with its own OG title, so editions can be shared on LinkedIn.
- `/rss.xml` and `/releases/{version}.md` are generated at build time (§5.9).
- IBM Plex Mono is self-hosted (Astro fonts, downloaded at build time), weights 400, 500, 600 only.
- Client JS budget: under 10 KB gzipped. No layout shift (CLS ≈ 0).

---

## 8. Config and open decisions

Environment variables (`.env`, see `.env.example`):

| Variable | Purpose | Status |
|---|---|---|
| `PUBLIC_SITE_URL` | canonical, OG, Slack, RSS and release links (required to build) | production domain: [TBD] |
| `PUBLIC_LINKEDIN_URL` | blame link | set |
| `PUBLIC_LINKEDIN_NEWSLETTER_URL` | follow → linkedin; falls back to the profile URL | [TBD] once the newsletter exists |
| `PUBLIC_GITHUB_URL` | follow → github (`/releases` is appended) | defaults to `https://github.com/max-roux/thefridayhotfix`; the repo must be public for readers |

The release workflow reads `PUBLIC_SITE_URL` from the repo's Actions variables.

---

## 9. Out of scope (planned later)

- Dark mode following the system setting
- Reader reactions per item (`LGTM` / `nit` / `needs more tests`)
- Sticky prompt bar that shows the current section (`$ git log`, `$ git blame`)
- Vim-style scroll ruler (`-- 37% --`)
- Flash highlight on the target item when arriving via a permalink
- Moods on older editions' dots

---

## 10. Acceptance checklist

- [ ] With JS disabled, all content is readable, all editions are expanded, the follow links work, and nothing is broken.
- [ ] Title types "The Fredag H" → "The Fr" → "The Friday Hotfix" once on first visit, in under ~3s, with no flash of the full title first and a solid cursor while typing; never again after that; instant under reduced motion.
- [ ] `--grep=ai` filters items in every edition, updates the URL, and survives a reload.
- [ ] `--oneline` hides takes, prod notes and stats everywhere.
- [ ] Older editions expand and collapse; `aria-expanded` is correct.
- [ ] Loading `#v2026.39-known-1` expands v2026.39 and scrolls to that item.
- [ ] "copy for slack" puts the exact §5.5 text (ending `Follow: {SITE_URL}`) on the clipboard; the fallback textarea appears when the clipboard is blocked.
- [ ] `j`/`k`/`enter`/`o`/`?`/`esc` work.
- [ ] No email field anywhere. The follow prompt links to the LinkedIn newsletter, `/rss.xml` and GitHub releases; hints change on hover and focus.
- [ ] `/rss.xml` validates (W3C feed validator) and lists every edition, newest first.
- [ ] `/releases/{version}.md` exists per edition; the workflow creates one GitHub release per new edition and skips existing ones.
- [ ] Logo A shows in the header, favicon (light and dark tab bars) and app icons.
- [ ] HEAD shows its mood face and a `mood: …` label; older dots fill on scroll; HEAD never changes.
- [ ] Footer ends with `EOF` and the flame dot.
- [ ] An unknown path shows the 404 with that path in the label and error line.
- [ ] The graph line follows the viewport centre; dots fill as they're passed.
- [ ] All tap targets are at least 44px; contrast ≥ 4.5:1; visible focus on every control.
- [ ] No horizontal scroll at 320px; Lighthouse accessibility score 100.
