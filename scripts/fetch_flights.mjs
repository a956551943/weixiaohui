import { chromium } from 'playwright';

const results = [];

async function scrapeCtrip(page) {
  const url = 'https://flights.ctrip.com/international/search/round-sha-OSA?depdate=2026-08-18_2026-08-23&cabin=y&adult=1';
  console.log('=== 携程查询 ===', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
    const text = await page.innerText('body');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const priceLines = lines.filter(l => /¥|￥|HO1505|HO3132|吉祥|东航|春秋|含税|往返/.test(l));
    results.push({ source: '携程', url, snippets: priceLines.slice(0, 80), full: text.slice(0, 15000) });
  } catch (e) {
    results.push({ source: '携程', error: e.message });
  }
}

async function scrapeLCCjp(page) {
  console.log('=== LCCjp 去程 8/18 ===');
  try {
    await page.goto('https://zh-cn.dsk.ne.jp/PVG-KIX/20260818/', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);
    const text = await page.innerText('body');
    results.push({ source: 'LCCjp去程8/18', snippets: text.split('\n').filter(l => /HO|MU|9C|¥|円|PVG|KIX|\d{2}:\d{2}/.test(l)).slice(0, 40) });
  } catch (e) {
    results.push({ source: 'LCCjp去程', error: e.message });
  }

  console.log('=== LCCjp 返程 8/23 ===');
  try {
    await page.goto('https://zh-cn.dsk.ne.jp/KIX-PVG/20260823/', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);
    const text = await page.innerText('body');
    results.push({ source: 'LCCjp返程8/23', snippets: text.split('\n').filter(l => /HO|MU|9C|¥|円|PVG|KIX|\d{2}:\d{2}/.test(l)).slice(0, 40) });
  } catch (e) {
    results.push({ source: 'LCCjp返程', error: e.message });
  }
}

async function scrapeJuneyao(page) {
  console.log('=== 吉祥航空官网 ===');
  try {
    await page.goto('https://www.juneyaoair.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    // Try to interact with search if possible
    const body = await page.innerText('body');
    results.push({ source: '吉祥官网首页', note: 'SPA需手动搜索，已抓取首页', snippets: body.split('\n').slice(0, 30) });
  } catch (e) {
    results.push({ source: '吉祥官网', error: e.message });
  }
}

async function scrapeSkyscanner(page) {
  const url = 'https://www.tianxun.com/transport/flights/pvg/kix/260818/260823/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false';
  console.log('=== Skyscanner 天巡 ===');
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
    const text = await page.innerText('body');
    const snippets = text.split('\n').map(l => l.trim()).filter(l => /¥|吉祥|HO |东航|春秋|直达|往返|08:|11:|15:|16:/.test(l));
    results.push({ source: 'Skyscanner天巡', url, snippets: snippets.slice(0, 60) });
  } catch (e) {
    results.push({ source: 'Skyscanner', error: e.message });
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'zh-CN',
});
const page = await context.newPage();

await scrapeLCCjp(page);
await scrapeSkyscanner(page);
await scrapeCtrip(page);
await scrapeJuneyao(page);

await browser.close();

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../data/flight_prices_raw.json');
writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to', out);
for (const r of results) {
  console.log('\n---', r.source, '---');
  if (r.error) console.log('ERROR:', r.error);
  else (r.snippets || []).forEach(s => console.log(s));
}
