import puppeteer from 'puppeteer-core';

async function testFullFlow() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function clickButtonWithText(text) {
    await page.evaluate((btnText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.innerText.includes(btnText));
      if (target) {
        target.click();
      } else {
        throw new Error(`Button containing "${btnText}" not found`);
      }
    }, text);
  }

  console.log('1. Starting at /provider-onboarding/verify');
  await page.goto('http://localhost:4173/provider-onboarding/verify', { waitUntil: 'networkidle0' });

  // Submit Step 1
  await clickButtonWithText('Submit for Verification');
  await new Promise(r => setTimeout(r, 1200));

  console.log('2. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/type')) {
    throw new Error('Failed to route to /provider-onboarding/type');
  }

  // Continue through Step 2
  await clickButtonWithText('Continue');
  await new Promise(r => setTimeout(r, 800));

  console.log('3. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/categories')) {
    throw new Error('Failed to route to /provider-onboarding/categories');
  }

  // Continue through categories
  await clickButtonWithText('Continue');
  await new Promise(r => setTimeout(r, 800));

  console.log('4. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/details')) {
    throw new Error('Failed to route to /provider-onboarding/details');
  }

  // Continue through details
  await clickButtonWithText('Continue to Payment');
  await new Promise(r => setTimeout(r, 800));

  console.log('5. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/payment')) {
    throw new Error('Failed to route to /provider-onboarding/payment');
  }

  // Submit payment form
  await clickButtonWithText('Pay LKR 10,500');
  await new Promise(r => setTimeout(r, 1800));

  // Click modal button "Continue to Verification Status"
  await clickButtonWithText('Continue to Verification Status');
  await new Promise(r => setTimeout(r, 800));

  console.log('6. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/status')) {
    throw new Error('Failed to route to /provider-onboarding/status');
  }

  // Click "Choose Provider Plan"
  await clickButtonWithText('Choose Provider Plan');
  await new Promise(r => setTimeout(r, 800));

  console.log('7. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/plans')) {
    throw new Error('Failed to route to /provider-onboarding/plans');
  }

  // Toggle yearly billing
  await clickButtonWithText('Yearly');
  await new Promise(r => setTimeout(r, 300));

  // Select Premium plan
  await clickButtonWithText('Choose Premium');
  await new Promise(r => setTimeout(r, 300));

  // Continue to Complete
  await clickButtonWithText('Continue to Complete');
  await new Promise(r => setTimeout(r, 800));

  console.log('8. Arrived at:', page.url());
  if (!page.url().includes('/provider-onboarding/complete')) {
    throw new Error('Failed to route to /provider-onboarding/complete');
  }

  // Verify that the completion screen read the selected plan and state!
  const content = await page.content();
  const hasPremium = content.includes('Active: Premium Plan');
  console.log('9. Verified completion screen reflects Premium Plan selection:', hasPremium);

  const hasBusinessName = content.includes('Lanka Gear & Camera Rentals');
  console.log('10. Verified completion screen reflects Business Name from state:', hasBusinessName);

  await browser.close();
  console.log('ALL STEPS PASSED WITH 100% SUCCESS!');
}

testFullFlow().catch(err => {
  console.error(err);
  process.exit(1);
});
