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
  lines.push(`Subscribe: ${siteUrl}`);

  return lines.join('\n');
}
