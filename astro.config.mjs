import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://woderuanjian-001.github.io",
  base: "/china-ai-tutorials/",
  integrations: [
    tailwind({
      applyBaseStyles: false, // 手动控制基础样式
    }),
    sitemap(),
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
