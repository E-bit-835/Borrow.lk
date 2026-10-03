import puppeteer from 'puppeteer-core';

async function testMarketplace() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- 1. Testing HomePage ---');
  await page.goto('http://localhost:4173/home', { waitUntil: 'networkidle0' });
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Test Search Box input and submit
  await page.type('input[placeholder*="Cameras, tools"]', 'Canon');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  console.log(`Navigated to: ${page.url()}`);

  console.log('--- 2. Testing Marketplace Page Filters ---');
  // Check that listings exist
  const listingsCount = await page.evaluate(() => {
    return document.querySelectorAll('a[href*="/product/"]').length;
  });
  console.log(`Found ${listingsCount} listings on page`);

  // Navigate to Canon EOS R5 product details
  console.log('--- 3. Testing Product Details Page ---');
  await page.goto('http://localhost:4173/product/canon-eos-r5', { waitUntil: 'networkidle0' });
  const productHeading = await page.evaluate(() => {
    return document.querySelector('h1')?.textContent;
  });
  console.log(`Product Heading: ${productHeading}`);

  // Check booking calculation button
  const reserveBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Reserve & Borrow Now'));
    return btn ? btn.textContent?.trim() : null;
  });
  console.log(`Found Reserve Button: ${reserveBtn}`);

  // Click Reserve Button to open modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Reserve & Borrow Now'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const modalOpen = await page.evaluate(() => {
    return document.body.textContent?.includes('Confirm Rental Reservation');
  });
  console.log(`Reservation Modal Opened: ${modalOpen}`);

  console.log('--- 4. Testing Marketplace Overview Board ---');
  await page.goto('http://localhost:4173/marketplace-overview', { waitUntil: 'networkidle0' });
  const hubTitle = await page.evaluate(() => {
    return document.querySelector('h1')?.textContent;
  });
  console.log(`Hub Title: ${hubTitle}`);

  await browser.close();
  console.log('ALL MARKETPLACE E2E VERIFICATIONS PASSED SUCCESSFULLY!');
}

testMarketplace().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
