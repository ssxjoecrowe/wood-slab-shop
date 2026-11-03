import { defineCollection, z } from 'astro:content';

const slabs = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    species: z.string(),
    price: z.number().int().positive(),
    dimensions: z.string(),
    weight_lbs: z.number().int().positive(),
    moisture_pct: z.number().min(0).max(30),
    status: z.enum(['available', 'pending', 'sold']),
    images: z.array(z.string().url().or(z.string().startsWith('/'))).min(1),
    description: z.string(),
    featured: z.boolean().default(false),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
});

export const collections = { slabs };