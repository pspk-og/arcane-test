// modules/asura.js
const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');

async function scrapeAsura({ url, title = 'asura_manga' }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Opening:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  const imgUrls = await page.$$eval('img.object-cover', imgs =>
    imgs
      .map(img => img.src)
      .filter(src =>
        src.startsWith('https://gg.asuracomic.net/storage/media') &&
        !src.includes('EndDesign')
      )
  );

  console.log(`🖼️ Found ${imgUrls.length} chapter images`);

  const folder = path.join(__dirname, '..', 'downloads', title.replace(/\s+/g, '_'));
  await fs.ensureDir(folder);

  let index = 1;
  for (const imgUrl of imgUrls) {
    try {
      const view = await page.goto(imgUrl);
      const buffer = await view.body();
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const filename = `${index.toString().padStart(3, '0')}${ext}`;
      const filePath = path.join(folder, filename);
      await fs.writeFile(filePath, buffer);
      console.log(`✅ Saved image ${index}: ${filePath}`);
      index++;
    } catch (e) {
      console.error(`❌ Error downloading image: ${imgUrl}`, e);
    }
  }

  await browser.close();
  return { success: true, count: index - 1 };
}

module.exports = scrapeAsura;
