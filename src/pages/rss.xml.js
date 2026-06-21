import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const tutorials = await getCollection("tutorials");

  // 按日期排序
  tutorials.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "China AI Tutorials — In-Depth Guides for Chinese AI Models",
    description: "Hands-on tutorials helping developers worldwide master Chinese AI tools — DeepSeek, Kimi, Qwen, Doubao, ZhipuAI GLM, Xiaomi MiMo, Kuaishou Kling, and more.",
    site: context.site,
    items: tutorials.map((t) => ({
      title: t.data.title,
      description: t.data.description,
      pubDate: t.data.date,
      link: `/tutorials/${t.slug}/`,
      categories: t.data.tags,
    })),
    customData: `<language>en</language>`,
  });
}
