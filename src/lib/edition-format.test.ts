import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatEditionDate,
  orderItems,
  releaseNotes,
  rssFeed,
  slackCopy,
  type PreparedEdition,
} from './edition-format.ts';

const item = (kind: 'new' | 'fixed' | 'known' | 'deprecated', title: string) => ({
  kind,
  topic: 'ai' as const,
  title,
  take: `${title} take`,
  url: `https://example.com/${title}`,
});

test('orderItems groups by kind and numbers ids per kind', () => {
  const ordered = orderItems('v1', [
    item('deprecated', 'd'),
    item('new', 'n1'),
    item('fixed', 'f'),
    item('new', 'n2'),
  ]);
  assert.deepEqual(
    ordered.map((i) => [i.id, i.label]),
    [
      ['v1-new-1', '+ new'],
      ['v1-new-2', '+ new'],
      ['v1-fixed-1', '✓ fixed'],
      ['v1-deprecated-1', '− deprecated'],
    ],
  );
});

test('formatEditionDate uses UTC', () => {
  assert.equal(formatEditionDate(new Date('2026-10-09')), 'Fri 9 Oct 2026');
});

const edition: PreparedEdition = {
  id: 'w1',
  version: 'v1',
  date: new Date('2026-10-09'),
  title: 'Title',
  prod: 'prod note',
  stats: { changed: '', plus: '', minus: '' },
  hash: 'abc1234',
  isHead: true,
  dateLabel: 'Fri 9 Oct 2026',
  items: orderItems('v1', [item('new', 'n')]),
};

test('slackCopy renders header, items, prod and follow link', () => {
  assert.equal(
    slackCopy(edition, 'https://site.test'),
    [
      'The Friday Hotfix · v1 · Fri 9 Oct 2026',
      'Title',
      '',
      '+ new  n',
      '    n take',
      '    https://example.com/n',
      '',
      '// from my prod',
      'prod note',
      '',
      'Follow: https://site.test',
    ].join('\n'),
  );
});

test('rssFeed links each edition and double-escapes HTML descriptions', () => {
  const xml = rssFeed([{ ...edition, title: 'R&D <live>' }], 'https://site.test', 'desc');
  assert.match(xml, /<title>v1 · R&amp;D &lt;live&gt;<\/title>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/site.test\/v1<\/guid>/);
  assert.match(xml, /<pubDate>Fri, 09 Oct 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(xml, /&lt;a href=&quot;https:\/\/example.com\/n&quot;&gt;n&lt;\/a&gt;/);
});

test('releaseNotes renders markdown with a link back to the edition', () => {
  const md = releaseNotes(edition, 'https://site.test');
  assert.match(md, /^\*\*Title\*\*\n\n- `\+ new` \[n\]\(https:\/\/example.com\/n\) `\[ai\]`: n take\n/);
  assert.match(md, /Read it on the site: https:\/\/site.test\/v1\n$/);
});
