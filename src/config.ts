/**
 * 站点全局配置
 * 修改此文件即可统一管理 AdSense、Analytics 等 ID
 *
 * ⚠️ 重要：如果你绑定了独立域名，只需修改下面的 url 字段即可，
 *          全站所有 OG/canonical/JSON-LD/sitemap 都会自动更新。
 */

export const SITE_CONFIG = {
  // === 基本信息 ===
  name: "China AI Tutorials",

  // ⭐ 站点根 URL（不带 base，末尾不要加 /）
  //    如果绑定独立域名，改这里即可，例如：
  //    url: "https://china-ai-tutorials.com"
  url: "https://woderuanjian-001.github.io",

  // ⭐ 子路径前缀（GitHub Pages 项目站点才有，独立域名应为 "/"）
  base: "/china-ai-tutorials/",

  // ⭐ 默认社交分享图片（必须是绝对 URL，相对路径在 Twitter/Facebook 上不显示）
  defaultOgImage: "/images/og-default.png",

  // === Google AdSense（⭐ 需手动填入） ===
  // 注册后从 adsense.google.com → 账号 → 账号信息 → 发布商 ID 获取
  adsense: {
    enabled: true, // AdSense 已配置，审批通过后自动生效
    publisherId: "pub-1325551504808613",
  },

  // === Google Analytics（⭐ 需手动填入） ===
  // 从 analytics.google.com → 管理 → 数据流 → 衡量 ID 获取（格式 G-XXXXXXXXXX）
  analytics: {
    enabled: true,
    measurementId: "G-PGBSXEQEWK",
  },
} as const;

/**
 * ============================================================================
 * URL 工具函数（SEO 绝对路径修复的核心）
 * ============================================================================
 *
 * 为什么需要这个函数？
 *
 * Astro 配置了 `site` + `base` 后，`Astro.site.href` 只返回 `site` 部分
 * （如 https://woderuanjian-001.github.io/），不会自动拼上 base 前缀。
 * 直接用 `new URL("/tutorials/x/", Astro.site)` 会得到错误的 URL：
 *
 *   ❌ https://woderuanjian-001.github.io/tutorials/x/      （缺 base 前缀）
 *   ✅ https://woderuanjian-001.github.io/china-ai-tutorials/tutorials/x/
 *
 * 这导致 og:url、canonical、JSON-LD、sitemap 的 URL 与页面真实 URL 不一致，
 * Google 会判定为数据错误，影响收录权重。
 *
 * 此函数统一处理 base 前缀拼接，全站调用此函数即可保证 URL 一致。
 */

/**
 * 把页面相对路径（如 "/tutorials/x/"）转换为完整绝对 URL。
 *
 * @param path 页面相对路径，必须以 / 开头，例如 "/tutorials/foo/" 或 "/images/a.png"
 * @returns 完整绝对 URL，例如 "https://woderuanjian-001.github.io/china-ai-tutorials/tutorials/foo/"
 *
 * @example
 * absoluteUrl("/tutorials/deepseek-api/")  // https://woderuanjian-001.github.io/china-ai-tutorials/tutorials/deepseek-api/
 * absoluteUrl("/")                          // https://woderuanjian-001.github.io/china-ai-tutorials/
 * absoluteUrl("/images/og-default.png")     // https://woderuanjian-001.github.io/china-ai-tutorials/images/og-default.png
 */
export function absoluteUrl(path: string): string {
  // 规范化输入：保证 path 以 / 开头
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // 规范化 base：去掉末尾 /，保证不重复
  const base = SITE_CONFIG.base.endsWith("/")
    ? SITE_CONFIG.base.slice(0, -1)
    : SITE_CONFIG.base;

  // 规范化 origin：保证末尾没有 /
  const origin = SITE_CONFIG.url.endsWith("/")
    ? SITE_CONFIG.url.slice(0, -1)
    : SITE_CONFIG.url;

  return `${origin}${base}${normalizedPath}`;
}

/**
 * 把图片相对路径转为绝对 URL（OG image、结构化数据图片专用）。
 *
 * 与 absoluteUrl 的区别：当传入的已经是完整 URL（http/https 开头）时直接返回，
 * 用于支持文章 frontmatter 里手写的绝对图片 URL。
 */
export function absoluteImageUrl(image: string | undefined): string {
  if (!image) {
    return absoluteUrl(SITE_CONFIG.defaultOgImage);
  }
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return absoluteUrl(image);
}

/**
 * ============================================================================
 * 联盟营销链接统一配置
 * ============================================================================
 *
 * 为什么集中管理？
 * - 换服务商/换推广码时只改一个地方，全站自动更新
 * - 避免 hardcode 到每篇文章里
 * - AffiliateButton 组件统一调用此配置
 *
 * ⚠️ 使用前必读：
 * 1. 把下面每个 URL 里的 YOUR_CODE 替换为你真实的推广码/邀请码
 * 2. 推广码获取方式见项目根目录的「联盟营销接入方案.md」
 * 3. 所有计划的有效性和返点比例会变化，建议每季度核对一次官方页面
 * 4. FTC/ASA 合规：所有联盟链接必须披露，AffiliateButton 已内置披露文案
 */

export interface AffiliateLink {
  /** 联盟链接（含你的推广码） */
  url: string;
  /** 显示用的平台名 */
  label: string;
  /** FTC 披露文案（空字符串表示无返佣，纯导流） */
  disclosure: string;
  /** 是否当前启用（false 则渲染为普通链接，不带 sponsored rel） */
  monetized: boolean;
}

export const AFFILIATE_LINKS = {
  // === 第一梯队：高返佣 + 强相关（必接） ===

  deepseek: {
    url: "https://platform.deepseek.com/",
    label: "DeepSeek API Platform",
    disclosure:
      "We may earn API credits if you sign up via this link, at no extra cost to you.",
    monetized: true,
  },

  qwen: {
    url: "https://www.aliyun.com/zh/referral",
    label: "Alibaba Cloud Bailian (Qwen)",
    disclosure:
      "We may earn commission if you sign up via this link, at no extra cost to you.",
    monetized: true,
  },

  glm: {
    url: "https://open.bigmodel.cn/pricing",
    label: "Zhipu GLM Platform",
    disclosure:
      "We may earn Tokens if you sign up via this link, at no extra cost to you.",
    monetized: true,
  },

  doubao: {
    url: "https://www.volcengine.com/product/ark",
    label: "Volcengine Ark (Doubao)",
    disclosure:
      "We may earn credits if you sign up via this link, at no extra cost to you.",
    monetized: true,
  },

  // === 第二梯队：海外用户支付痛点（高客单价） ===

  wildcard: {
    url: "https://wildcard.com.cn/",
    label: "WildCard — Pay for Chinese AI APIs from abroad",
    disclosure:
      "We earn a referral bonus for each successful signup via this link.",
    monetized: true,
  },

  novita: {
    url: "https://novita.ai/",
    label: "Novita AI — One-stop API for Chinese models",
    disclosure:
      "We may earn API credits if you sign up via this link, at no extra cost to you.",
    monetized: true,
  },

  // === 第三梯队：暂无返佣，纯导流（monetized: false） ===

  kimi: {
    url: "https://platform.kimi.ai/",
    label: "Kimi API Platform",
    disclosure: "",
    monetized: false,
  },

  ernie: {
    url: "https://cloud.baidu.com/product/wenxinworkshop/",
    label: "Baidu ERNIE Bot",
    disclosure: "",
    monetized: false,
  },

  hunyuan: {
    url: "https://cloud.tencent.com/product/hunyuan",
    label: "Tencent Hunyuan",
    disclosure: "",
    monetized: false,
  },
} as const satisfies Record<string, AffiliateLink>;

/** 联盟平台键名类型（给 AffiliateButton 组件做类型约束） */
export type AffiliatePlatform = keyof typeof AFFILIATE_LINKS;
