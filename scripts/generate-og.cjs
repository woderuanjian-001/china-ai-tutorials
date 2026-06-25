// 用 Playwright 生成三张 OG 图片
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const htmlFile = path.resolve('C:/Users/Administrator/projects/china-ai-tutorials/public/images/og-generator.html');
const outDir = path.resolve('C:/Users/Administrator/projects/china-ai-tutorials/public/images');

const cards = [
  { id: 'card1', filename: 'og-deepseek-v4-30-day-review.png' },
  { id: 'card2', filename: 'og-kling-api-developer-guide.png' },
  { id: 'card3', filename: 'og-china-ai-api-cost-diary.png' },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });

  const html = fs.readFileSync(htmlFile, 'utf-8');
  await page.setContent(html);

  for (const card of cards) {
    // 把当前卡片移到可见区域，隐藏其他
    await page.evaluate((activeId) => {
      document.querySelectorAll('.card').forEach(el => {
        el.style.position = 'absolute';
        el.style.left = '-9999px';
      });
      const active = document.getElementById(activeId);
      if (active) {
        active.style.position = 'static';
        active.style.left = '0';
      }
    }, card.id);

    // 等待渲染
    await page.waitForTimeout(300);

    // 截取可见卡片
    const cardEl = await page.$(`#${card.id}`);
    if (cardEl) {
      const outPath = path.join(outDir, card.filename);
      await cardEl.screenshot({ path: outPath, type: 'png' });
      console.log(`✅ 已生成: ${outPath}`);
    } else {
      console.log(`❌ 未找到元素: #${card.id}`);
    }
  }

  await browser.close();
  console.log('\n🎉 三张 OG 图片全部生成完毕！');
})();
