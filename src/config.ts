/**
 * 站点全局配置
 * 修改此文件即可统一管理 AdSense、Analytics 等 ID
 */

export const SITE_CONFIG = {
  // === 基本信息 ===
  name: "China AI Tutorials",
  url: "https://woderuanjian-001.github.io",
  base: "/china-ai-tutorials/",

  // === Google AdSense（⭐ 需手动填入） ===
  // 注册后从 adsense.google.com → 账号 → 账号信息 → 发布商 ID 获取
  adsense: {
    enabled: false, // 拿到 AdSense 审批通过后改为 true
    publisherId: "pub-0000000000000000", // 替换为你的真实 ID
  },

  // === Google Analytics（⭐ 需手动填入） ===
  // 从 analytics.google.com → 管理 → 数据流 → 衡量 ID 获取（格式 G-XXXXXXXXXX）
  analytics: {
    enabled: false, // 创建 GA 账号后改为 true
    measurementId: "G-XXXXXXXXXX", // 替换为你的真实衡量 ID
  },
} as const;
