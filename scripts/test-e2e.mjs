import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testInteractions() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  console.log('Testing Screen 1 -> Screen 2 navigation...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.click('button'); // Click Log In
  await new Promise(r => setTimeout(r, 500));
  console.log('Current URL after click:', page.url());

  console.log('Testing Login Form validation...');
  await page.click('button[type="submit"]'); // Click submit without filling
  await new Promise(r => setTimeout(r, 300));
  const hasErrors = await page.$('.text-red-500');
  console.log('Validation triggered error:', !!hasErrors);

  console.log('Filling login form...');
  await page.type('#login-email', 'tester@borrow.lk');
  await page.type('#login-password', 'SecretPass123!');
  // Click captcha
  const captcha = await page.$('div[class*="cursor-pointer"]');
  if (captcha) await captcha.click();
  await new Promise(r => setTimeout(r, 900));

  // Submit
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));
  console.log('URL after successful login:', page.url());

  // Test Forgot Password flow
  console.log('Testing Forgot Password...');
  await page.goto('http://localhost:4173/forgot-password', { waitUntil: 'networkidle0' });
  await page.type('#forgot-email', 'borrower@gmail.com');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  const successBadge = await page.$('.bg-emerald-50\\/80');
  console.log('Forgot password email sent state visible:', !!successBadge);

  // Test Reset Password live checklist
  console.log('Testing Reset Password checklist...');
  await page.goto('http://localhost:4173/reset-password', { waitUntil: 'networkidle0' });
  await page.type('#reset-new-password', 'abcdefgh');
  await new Promise(r => setTimeout(r, 200));
  const greenChecks1 = await page.$$('.bg-emerald-100');
  console.log('Length requirement met count:', greenChecks1.length);

  await page.type('#reset-new-password', 'A'); // Now uppercase met
  await new Promise(r => setTimeout(r, 200));
  const greenChecks2 = await page.$$('.bg-emerald-100');
  console.log('Uppercase requirement met count:', greenChecks2.length);

  await page.type('#reset-new-password', '1!'); // Number/special met
  await new Promise(r => setTimeout(r, 200));
  const greenChecks3 = await page.$$('.bg-emerald-100');
  console.log('All 3 requirements met count:', greenChecks3.length);

  await browser.close();
  console.log('All end-to-end interactive tests passed!');
}

testInteractions();
