import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDir = 'C:\\Users\\sadsa\\.gemini\\antigravity\\brain\\9f7ed73d-73d8-42bf-bc6e-094beba32d6d\\scratch';

async function checkMobile() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const pages = [
    { url: 'http://localhost:4173/login', name: 'mobile_login.png' },
    { url: 'http://localhost:4173/signup', name: 'mobile_signup.png' },
    { url: 'http://localhost:4173/forgot-password', name: 'mobile_forgot.png' },
    { url: 'http://localhost:4173/reset-password', name: 'mobile_reset.png' },
  ];

  for (const p of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 750, isMobile: true, hasTouch: true });
    await page.goto(p.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outputDir, p.name) });
    console.log(`Saved ${p.name}`);
    await page.close();
  }

  await browser.close();
  console.log('Mobile screenshots captured successfully');
}

checkMobile();
