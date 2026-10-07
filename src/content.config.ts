import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const itemSchema = z.object({
  kind: z.enum(['new', 'fixed', 'known', 'deprecated']),
  topic: z.enum(['platform', 'bi', 'ai']),
  title: z.string(),
  take: z.string(),
  url: z.string().url(),
});

const editions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/editions' }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    title: z.string(),
    mood: z.enum(['shipped', 'hype-detected', 'merge-conflict', 'friday']).optional(),
    items: z.array(itemSchema),
    prod: z.string(),
    stats: z.object({
      changed: z.string(),
      plus: z.string(),
      minus: z.string(),
    }),
  }),
});

export const collections = { editions };
