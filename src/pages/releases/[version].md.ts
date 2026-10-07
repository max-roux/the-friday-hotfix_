import type { APIRoute, GetStaticPaths } from 'astro';
import { getEditions, type PreparedEdition } from '../../lib/editions';
import { releaseNotes } from '../../lib/edition-format';
import { SITE_URL } from '../../lib/site';

/** Release notes for .github/workflows/release.yml (§5.9). */
export const getStaticPaths = (async () =>
  (await getEditions()).map((edition) => ({
    params: { version: edition.version },
    props: { edition },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(releaseNotes((props as { edition: PreparedEdition }).edition, SITE_URL), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
