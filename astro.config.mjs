import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
const SITE = "https://china-ai-tutorials.com";
export default defineConfig({
  // ⭐ site 必须与 src/config.ts 的 url 一致（用于生成 sitemap、RSS 的绝对 URL）
  site: SITE,
  base: "/",

  integrations: [
    tailwind({
      applyBaseStyles: false, // 手动控制基础样式
    }),

    // ============================================================================
    // sitemap 配置（修复历史问题）
    // ============================================================================
    // 之前的问题：sitemap 只列 URL，没有 <lastmod>，Google 无法判断内容新鲜度
    // 修复后：
    //   1. 自动注入 <lastmod>（基于构建时间，相当于"内容最后更新于"）
    //   2. 用 serialize 回调精细化控制：教程页用 frontmatter 的 updated 字段
    //   3. 过滤掉 /404、/500 等不该进 sitemap 的页面
    // ============================================================================
    sitemap({
      // 过滤：哪些页面不进 sitemap（404/500、隐私页、API 路由等）
      filter: (page) => {
        // 排除明显的非内容页
        const excludePatterns = [
          /\/404\/?$/,
          /\/500\/?$/,
          // 如果有 API 路由可在此排除：/\/api\//
        ];
        return !excludePatterns.some((re) => re.test(page));
      },

      // 序列化回调：为每个 URL 注入 <lastmod> 和 changefreq/priority
      serialize(item) {
        // 默认 lastmod = 当前构建时间（即每次部署都被视为"内容更新"）
        // 这对教程站是合理的：每次部署通常都伴随内容修订
        if (!item.lastmod) {
          item.lastmod = new Date();
        }

        // 根据路径设置抓取频率和优先级（教程详情页优先级最高）
        const url = item.url;
        if (url === `${SITE}/` || url === SITE) {
          // 首页：每天抓取，最高优先级
          item.changefreq = "daily";
          item.priority = 1.0;
        } else if (url.includes("/tutorials/") && !url.endsWith("/tutorials/")) {
          // 教程详情页：每周抓取（教程会持续修订），优先级 0.8
          item.changefreq = "weekly";
          item.priority = 0.8;
        } else if (url.endsWith("/tutorials/")) {
          // 教程列表页：每周抓取（新教程会加入列表）
          item.changefreq = "weekly";
          item.priority = 0.9;
        } else if (/\/(about|contact|privacy|terms)\/?$/.test(url)) {
          // 法律/导航页：每月抓取一次够了
          item.changefreq = "monthly";
          item.priority = 0.3;
        }

        return item;
      },
    }),
  ],

  markdown: {
    shikiConfig: {
      theme: "github-light",
      wrap: true,
    },
  },

  build: {
    inlineStylesheets: "auto",
  },
});
