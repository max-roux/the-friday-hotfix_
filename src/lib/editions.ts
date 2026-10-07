import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_URL } from './site';

export type ItemKind = 'new' | 'fixed' | 'known' | 'deprecated';
export type ItemTopic = 'platform' | 'bi' | 'ai';

export type EditionItem = {
  kind: ItemKind;
  topic: ItemTopic;
  title: string;
  take: string;
  url: string;
  id: string;
  label: string;
};

export type PreparedEdition = {
  id: string;
  version: string;
  date: Date;
  title: string;
  prod: string;
  stats: { changed: string; plus: string; minus: string };
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

function orderItems(
  version: string,
  items: CollectionEntry<'editions'>['data']['items'],
): EditionItem[] {
  return KIND_ORDER.flatMap((kind) => {
    const group = items.filter((item) => item.kind === kind);
    return group.map((item, index) => ({
      ...item,
      id: `${version}-${kind}-${index + 1}`,
      label: KIND_LABELS[kind],
    }));
  });
}

export async function getEditions(): Promise<PreparedEdition[]> {
  const entries = await getCollection('editions');
  const sorted = [...entries].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const headDate = sorted[0]?.data.date.getTime();

  return sorted.map((entry) => {
    const { version, date, title, items, prod, stats } = entry.data;
    return {
      id: entry.id,
      version,
      date,
      title,
      prod,
      stats,
      hash: editionHash(version),
      isHead: date.getTime() === headDate,
      dateLabel: formatEditionDate(date),
      items: orderItems(version, items),
    };
  });
}

export function slackCopy(edition: PreparedEdition, siteUrl = SITE_URL): string {
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
