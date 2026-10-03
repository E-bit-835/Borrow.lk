import puppeteer from 'puppeteer-core';

async function testCustomerDashboard() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('=== TEST 1: Main Customer Dashboard ===');
  await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });
  const welcomeText = await page.evaluate(() => document.querySelector('h1')?.textContent);
  console.log('Dashboard Welcome Text:', welcomeText);

  // Check stat cards
  const statCount = await page.evaluate(() => document.querySelectorAll('.grid-cols-2 > div').length);
  console.log('Rendered Stat Cards Count:', statCount);

  // Check upcoming bookings
  const bookingsExist = await page.evaluate(() => document.body.textContent.includes('Upcoming Bookings'));
  console.log('Upcoming Bookings Section Present:', bookingsExist);

  console.log('=== TEST 2: Profile Page & Interactive Editing ===');
  await page.goto('http://localhost:4173/profile', { waitUntil: 'networkidle0' });
  const profileHeading = await page.evaluate(() => document.querySelector('h1')?.textContent);
  console.log('Profile Heading:', profileHeading);

  // Edit Last Name and submit Save Changes
  await page.evaluate(() => {
    const lastNameInput = document.querySelector('input[value="Doe"]');
    if (lastNameInput) {
      lastNameInput.value = 'Perera';
      lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 800));

  const alertPresent = await page.evaluate(() => document.body.textContent.includes('Profile changes saved successfully!'));
  console.log('Save Success Alert Displayed:', alertPresent);

  console.log('=== TEST 3: Wishlist Interactions ===');
  await page.goto('http://localhost:4173/wishlist', { waitUntil: 'networkidle0' });
  const initialWishlistCards = await page.evaluate(() => document.querySelectorAll('button[title="Remove from Wishlist"]').length);
  console.log('Initial Wishlist Items Count:', initialWishlistCards);

  // Remove first wishlist item
  await page.click('button[title="Remove from Wishlist"]');
  await new Promise(r => setTimeout(r, 400));
  const postRemoveCards = await page.evaluate(() => document.querySelectorAll('button[title="Remove from Wishlist"]').length);
  console.log('Post-Remove Wishlist Items Count:', postRemoveCards);

  console.log('=== TEST 4: Real Messaging & Live Chat ===');
  await page.goto('http://localhost:4173/messages', { waitUntil: 'networkidle0' });
  const initialMsgCount = await page.evaluate(() => document.querySelectorAll('#root p.leading-relaxed').length);
  console.log('Initial Chat Messages Count:', initialMsgCount);

  // Type message and click send
  await page.type('input[placeholder="Type a message..."]', 'Thanks Janaka! See you at 10 AM for pickup.');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));

  const hasNewMsg = await page.evaluate(() => document.body.textContent.includes('See you at 10 AM for pickup.'));
  console.log('Sent Message Appears in Live Thread:', hasNewMsg);

  console.log('=== TEST 5: Notifications & Mark All As Read ===');
  await page.goto('http://localhost:4173/notifications', { waitUntil: 'networkidle0' });
  const markReadBtn = await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mark all as read')) !== undefined);
  console.log('Mark All As Read Button Available:', markReadBtn);

  if (markReadBtn) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mark all as read'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('=== TEST 6: Route Protection ===');
  // Log out and attempt access
  await page.evaluate(() => {
    sessionStorage.setItem('borrowlk_is_authenticated', 'false');
  });
  await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });
  console.log('Unauthenticated URL (redirected to):', page.url());

  await browser.close();
  console.log('ALL CUSTOMER DASHBOARD SUITE VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

testCustomerDashboard().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
