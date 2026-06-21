import { defineCollection, z } from "astro:content";

const tutorials = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    level: z.enum(["Beginner", "Advanced", "Expert"]).default("Beginner"),
  }),
});

export const collections = { tutorials };
