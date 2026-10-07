/** Pure edition helpers, kept free of `astro:*` imports so `npm test` can run them in plain Node. */
import { createHash } from 'node:crypto';
import type { CollectionEntry } from 'astro:content';

type EditionData = CollectionEntry<'editions'>['data'];
type RawItem = EditionData['items'][number];
export type ItemKind = RawItem['kind'];

export type EditionItem = RawItem & { id: string; label: string };

export type PreparedEdition = Omit<EditionData, 'items'> & {
  id: string;
  hash: string;
  isHead: boolean;
  dateLabel: string;
  items: EditionItem[];
};

const KIND_ORDER: ItemKind[] = ['new', 'fixed', 'known', 'deprecated'];

const KIND_LABELS: Record<ItemKind, string> = {
  new: '+ new',
  fixed: '✓ fixed',
  known: '! known',
  deprecated: '− deprecated',
};

export function editionHash(version: string): string {
  return createHash('sha1').update(version).digest('hex').slice(0, 7);
}

export function formatEditionDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function orderItems(version: string, items: RawItem[]): EditionItem[] {
  return KIND_ORDER.flatMap((kind) => {
    const group = items.filter((item) => item.kind === kind);
    return group.map((item, index) => ({
      ...item,
      id: `${version}-${kind}-${index + 1}`,
      label: KIND_LABELS[kind],
    }));
  });
}

export function slackCopy(edition: PreparedEdition, siteUrl: string): string {
  const lines: string[] = [
    `The Friday Hotfix · ${edition.version} · ${edition.dateLabel}`,
    edition.title,
    '',
  ];

  for (const item of edition.items) {
    lines.push(`${item.label}  ${item.title}`);
    lines.push(`    ${item.take}`);
    lines.push(`    ${item.url}`);
    lines.push('');
  }

  lines.push('// from my prod');
  lines.push(edition.prod);
  lines.push('');
  lines.push(`Follow: ${siteUrl}`);

  return lines.join('\n');
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed (§5.9). `description` is HTML, escaped once more for XML. */
export function rssFeed(
  editions: PreparedEdition[],
  siteUrl: string,
  description: string,
): string {
  const items = editions.map((edition) => {
    const link = new URL(`/${edition.version}`, siteUrl).toString();
    const html =
      `<ul>${edition.items
        .map((i) => `<li>${esc(i.label)} <a href="${esc(i.url)}">${esc(i.title)}</a>: ${esc(i.take)}</li>`)
        .join('')}</ul>` + `<p>// from my prod<br>${esc(edition.prod)}</p>`;
    return [
      '<item>',
      `<title>${esc(`${edition.version} · ${edition.title}`)}</title>`,
      `<link>${link}</link>`,
      `<guid isPermaLink="true">${link}</guid>`,
      `<pubDate>${edition.date.toUTCString()}</pubDate>`,
      `<description>${esc(html)}</description>`,
      '</item>',
    ].join('');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    '<title>The Friday Hotfix</title>',
    `<link>${esc(siteUrl)}</link>`,
    `<description>${esc(description)}</description>`,
    '<language>en</language>',
    ...items,
    '</channel></rss>',
  ].join('\n');
}

/** Markdown notes for the edition's GitHub release (§5.9). */
export function releaseNotes(edition: PreparedEdition, siteUrl: string): string {
  const { changed, plus, minus } = edition.stats;
  return [
    `**${edition.title}**`,
    '',
    ...edition.items.map(
      (i) => `- \`${i.label}\` [${i.title}](${i.url}) \`[${i.topic}]\`: ${i.take}`,
    ),
    '',
    '> // from my prod',
    `> ${edition.prod}`,
    '',
    `${changed}, ${plus}, ${minus}`,
    '',
    `Read it on the site: ${new URL(`/${edition.version}`, siteUrl)}`,
    '',
  ].join('\n');
}
