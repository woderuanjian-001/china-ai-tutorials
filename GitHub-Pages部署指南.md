# GitHub Pages 部署完整指南（含 robots.txt / 404.html）

> 生成日期：2026-06-22
> 你的仓库情况（已实测）：项目仓库 `woderuanjian-001/china-ai-tutorials`
> 这意味着你需要建用户主页仓库才能让根路径 `/robots.txt` 生效

---

## 🔍 第 0 步：先确认你的仓库类型

在项目目录执行（**已帮你跑过，结果如下**）：

```bash
cd C:/Users/Administrator/projects/china-ai-tutorials
git remote -v
```

**你的实测输出**：
```
origin  git@github.com:woderuanjian-001/china-ai-tutorials.git (fetch)
origin  git@github.com:woderuanjian-001/china-ai-tutorials.git (push)
```

**结论**：你的远程是**项目仓库** `china-ai-tutorials`，不是用户主页仓库。所以 `https://woderuanjian-001.github.io/robots.txt`（根路径）会返回 404。

下面给出两种方案，**强烈推荐方案 A（独立域名）**。

---

## 🏆 方案 A：绑定独立域名（推荐，一劳永逸）

这是根治方案。注册一个 `.com` 域名（约 ¥80/年），所有问题（robots、404、SEO、AdSense 申请）一并解决。

### Step A1：注册域名

推荐平台（按价格/服务排序）：
- **Cloudflare Registrar**（https://dash.cloudflare.com）— 成本价，无加价，免费 CDN/DNS
- **Namecheap**（https://www.namecheap.com）— 老牌，首年便宜
- **阿里云万网**（https://wanwang.aliyun.com）— 国内访问快，但需实名

**推荐域名**（截至 2026-06 可能仍可注册，请自查）：
- `china-ai-tutorials.com`（首选，与项目同名）
- `chinese-ai-guide.com`
- `deepseek-tutorial.com`
- `cnailab.com`（短）

### Step A2：在 GitHub 项目仓库根目录添加 CNAME 文件

```bash
cd C:/Users/Administrator/projects/china-ai-tutorials

# 创建 CNAME 文件（内容就是你的域名，不带 https://）
echo "china-ai-tutorials.com" > public/CNAME
```

### Step A3：修改 `src/config.ts` 和 `astro.config.mjs`

```typescript
// src/config.ts 改这两行
url: "https://china-ai-tutorials.com",  // 改成你的域名
base: "/",                                // 独立域名用根路径
```

```javascript
// astro.config.mjs 改这两行
site: "https://china-ai-tutorials.com",
base: "/",  // 或者直接删掉 base 字段
```

### Step A4：配置 DNS（在域名注册商后台）

添加以下 DNS 记录（以 Cloudflare 为例）：

| 类型 | 名称 | 值 | 代理状态 |
|------|------|-----|---------|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `woderuanjian-001.github.io` | DNS only |

> GitHub Pages 的 4 个 IP 是固定的，所有用户共用。

### Step A5：在 GitHub 仓库启用自定义域名

```bash
# 用 gh CLI（需先安装 gh 并登录）
gh repo edit woderuanjian-001/china-ai-tutorials \
  --enable-issues \
  --description "China AI Tutorials"

# 或者用浏览器：
# 1. 打开 https://github.com/woderuanjian-001/china-ai-tutorials/settings/pages
# 2. 在 "Custom domain" 里填 china-ai-tutorials.com
# 3. 点 Save
# 4. 勾选 "Enforce HTTPS"（等 5-10 分钟 GitHub 自动签发证书）
```

### Step A6：提交并推送

```bash
cd C:/Users/Administrator/projects/china-ai-tutorials
git add public/CNAME src/config.ts astro.config.mjs
git commit -m "feat: 绑定独立域名 china-ai-tutorials.com"
git push origin main
```

### Step A7：验证

```bash
# 等 5-10 分钟后验证
curl -I https://china-ai-tutorials.com/robots.txt
# 期望：HTTP/1.1 200 OK

curl https://china-ai-tutorials.com/sitemap-index.xml
# 期望：返回 XML
```

### Step A8：在 Google Search Console 添加新域名

1. 打开 https://search.google.com/search-console
2. 添加新资产 → 域名 → 输入 `china-ai-tutorials.com`
3. 用 DNS TXT 记录验证所有权（在 Cloudflare 后台加一条 TXT 记录）
4. 提交 sitemap：`https://china-ai-tutorials.com/sitemap-index.xml`

---

## 🆓 方案 B：用免费用户主页仓库（零成本，但有局限）

如果你暂时不想买域名，可以用这个方案。**缺点**：URL 还是 `woderuanjian-001.github.io/china-ai-tutorials/`，AdSense 申请大概率被拒。

### Step B1：创建用户主页仓库

```bash
# 用 gh CLI 创建
gh repo create woderuanjian-001.github.io --public --description "User homepage"

# 或者用浏览器：
# 打开 https://github.com/new
# Repository name: woderuanjian-001.github.io
# Public
# 勾选 "Add a README file"
# Create repository
```

### Step B2：克隆到本地

```bash
cd C:/Users/Administrator/projects
git clone git@github.com:woderuanjian-001/woderuanjian-001.github.io.git
cd woderuanjian-001.github.io
```

### Step B3：把准备好的文件放进去

```bash
# 把项目根目录里的两个「根目录-xxx」文件复制过来并重命名
cp ../china-ai-tutorials/根目录-robots.txt ./robots.txt
cp ../china-ai-tutorials/根目录-404.html ./404.html

# 创建一个简单的 index.html，跳转到主站
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=https://woderuanjian-001.github.io/china-ai-tutorials/">
  <title>China AI Tutorials</title>
</head>
<body>
  Redirecting to <a href="https://woderuanjian-001.github.io/china-ai-tutorials/">China AI Tutorials</a>...
</body>
</html>
EOF
```

### Step B4：提交并推送

```bash
git add .
git commit -m "feat: 部署 robots.txt + 404.html 到用户主页仓库"
git push origin main
```

### Step B5：启用 GitHub Pages

```bash
# 用 gh CLI（仓库创建后 Pages 默认对 user/org 仓库自动启用）
# 如果没自动启用，用浏览器：
# 打开 https://github.com/woderuanjian-001/woderuanjian-001.github.io/settings/pages
# Source: Deploy from a branch
# Branch: main / root
# Save
```

### Step B6：验证

```bash
# 等 1-2 分钟后验证
curl -I https://woderuanjian-001.github.io/robots.txt
# 期望：HTTP/1.1 200 OK

curl https://woderuanjian-001.github.io/robots.txt
# 期望：看到 Sitemap 行
```

---

## 📤 第 1 步：把所有改动推送到项目仓库

无论你选方案 A 还是 B，下面这步都要做。

```bash
cd C:/Users/Administrator/projects/china-ai-tutorials

# 1. 查看所有改动
git status
git diff

# 2. 暂存所有修改的源码文件
git add astro.config.mjs
git add src/config.ts
git add src/components/SEO.astro
git add src/components/AdSense.astro
git add src/components/Analytics.astro
git add src/components/CookieConsent.astro
git add src/components/AffiliateButton.astro
git add src/pages/privacy.astro
git add src/pages/tutorials/\[slug\].astro

# 3. 暂存新文章
git add src/content/tutorials/deepseek-v4-vs-gpt5-benchmark.md

# 4. 暂存方案文档（可选，看你愿不愿把文档提交进仓库）
# git add "30篇精品选题清单.md"
# git add "联盟营销接入方案.md"
# git add "根目录部署说明.md"
# git add "根目录-robots.txt"
# git add "根目录-404.html"
# git add "GitHub-Pages部署指南.md"

# 5. 提交（约定式提交，中文）
git commit -m "feat: SEO 绝对路径修复 + Cookie Consent v2 + AffiliateButton 组件 + 旗舰文章

- 修复 og:url/canonical/JSON-LD 缺失 base 前缀的致命 bug
- sitemap 加 lastmod/changefreq/priority
- CookieConsent 升级为细粒度同意 + Google Consent Mode v2
- AdSense/Analytics 根据 cookie 同意状态加载
- 隐私页加撤回同意按钮
- 新增 AffiliateButton 组件 + 联盟链接配置
- 新增旗舰文章: DeepSeek V4 vs GPT-5 benchmark"

# 6. 推送
git push origin main
```

---

## ✅ 第 2 步：部署后验证清单

### 必查项（核心 SEO）

```bash
# 1. sitemap 有 lastmod
curl -s https://woderuanjian-001.github.io/china-ai-tutorials/sitemap-0.xml | grep -o '<lastmod>[^<]*</lastmod>' | head -3
# 期望：每条都有 <lastmod>2026-...</lastmod>

# 2. OG 用绝对路径
curl -s https://woderuanjian-001.github.io/china-ai-tutorials/ | grep 'og:image'
# 期望：content="https://...github.io/china-ai-tutorials/images/og-default.png"

# 3. JSON-LD 与 og:url 一致
curl -s https://woderuanjian-001.github.io/china-ai-tutorials/ | grep -E 'og:url|"url"'
# 期望：两个 URL 完全一致

# 4. 根路径 robots.txt（方案 B 部署后）
curl -I https://woderuanjian-001.github.io/robots.txt
# 期望：HTTP/1.1 200 OK（不再是 404）
```

### 可选验证

```bash
# 5. 404 页面跳转
curl -I https://woderuanjian-001.github.io/china-ai-tutorials/this-page-does-not-exist
# 期望：HTTP/1.1 404，但有 HTML 内容（GitHub Pages 用 404.html）

# 6. 新旗舰文章可访问
curl -I https://woderuanjian-001.github.io/china-ai-tutorials/tutorials/deepseek-v4-vs-gpt5-benchmark/
# 期望：HTTP/1.1 200 OK

# 7. AdSense 在未同意时不加载（用浏览器 F12 Network 面板检查）
# 打开网站 → 不点 Accept → Network 面板里应该看不到 pagead2.googlesyndication.com
```

---

## ⚠️ 常见问题

### Q: `git push` 报权限错误？

```bash
# 检查 SSH key 是否配置
ssh -T git@github.com
# 期望：Hi woderuanjian-001! You've successfully authenticated...

# 如果失败，用 HTTPS 替代 SSH
git remote set-url origin https://github.com/woderuanjian-001/china-ai-tutorials.git
```

### Q: GitHub Pages 部署后网站没更新？

```bash
# 检查 Actions 状态
gh run list --repo woderuanjian-001/china-ai-tutorials --limit 5

# 或浏览器打开
# https://github.com/woderuanjian-001/china-ai-tutorials/actions
```

### Q: 自定义域名 HTTPS 证书签发失败？

GitHub Pages 的 HTTPS 证书最多需要 24 小时签发。如果超时：
1. 检查 DNS 记录是否正确（用 `dig china-ai-tutorials.com`）
2. 在 GitHub Pages 设置里取消勾选 Enforce HTTPS，等 10 分钟再勾选
3. 确认 DNS 代理状态是「DNS only」（如果用了 Cloudflare proxy，证书会冲突）

### Q: 方案 B 部署后，根路径 robots.txt 还是 404？

最常见原因：仓库**根目录**（不是子目录）没有 `robots.txt`。检查：
```bash
# 克隆下来检查
git clone git@github.com:woderuanjian-001/woderuanjian-001.github.io.git /tmp/check
ls /tmp/check/
# 必须能看到 robots.txt 和 404.html 在根目录
```

---

## 🎯 推荐执行顺序

1. **今天**：做方案 B（零成本，5 分钟），让根路径 robots.txt 生效
2. **本周内**：做方案 A（买域名），这是申请 AdSense 的前置条件
3. **本周内**：把项目改动 push 上去，触发 GitHub Pages 重新部署
4. **下周一**：去 Google Search Console 提交 sitemap，开始等收录

---

## 📞 命令速查（复制即用）

```bash
# === 方案 B 快速部署（推荐先做这个） ===

# 1. 在本地 projects 目录操作
cd C:/Users/Administrator/projects

# 2. 克隆或创建用户主页仓库（如果不存在）
gh repo create woderuanjian-001.github.io --public --clone || \
  git clone git@github.com:woderuanjian-001/woderuanjian-001.github.io.git

cd woderuanjian-001.github.io

# 3. 复制准备好的文件
cp ../china-ai-tutorials/根目录-robots.txt ./robots.txt
cp ../china-ai-tutorials/根目录-404.html ./404.html

# 4. 创建跳转 index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=https://woderuanjian-001.github.io/china-ai-tutorials/">
<title>China AI Tutorials</title></head>
<body>Redirecting to <a href="https://woderuanjian-001.github.io/china-ai-tutorials/">China AI Tutorials</a>...</body></html>
EOF

# 5. 提交推送
git add .
git commit -m "feat: 部署 robots.txt 和 404.html"
git push origin main

# 6. 验证（等 1-2 分钟）
curl -I https://woderuanjian-001.github.io/robots.txt
```
