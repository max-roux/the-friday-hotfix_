import type { APIRoute } from 'astro';
import { getEditions } from '../lib/editions';
import { rssFeed } from '../lib/edition-format';
import { SITE_DESCRIPTION, SITE_URL } from '../lib/site';

export const GET: APIRoute = async () =>
  new Response(rssFeed(await getEditions(), SITE_URL, SITE_DESCRIPTION), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
