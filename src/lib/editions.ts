import { getCollection } from 'astro:content';
import {
  editionHash,
  formatEditionDate,
  orderItems,
  type PreparedEdition,
} from './edition-format';

export { slackCopy, type PreparedEdition } from './edition-format';

export async function getEditions(): Promise<PreparedEdition[]> {
  const entries = await getCollection('editions');
  const sorted = [...entries].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return sorted.map((entry, index) => {
    const { version, date, title, mood, items, prod, stats } = entry.data;
    return {
      id: entry.id,
      version,
      date,
      title,
      mood,
      prod,
      stats,
      hash: editionHash(version),
      isHead: index === 0,
      dateLabel: formatEditionDate(date),
      items: orderItems(version, items),
    };
  });
}
