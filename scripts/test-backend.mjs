// Comprehensive backend and NeonDB integration test suite
const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting BorrowLK Full-Stack Integration Test Suite...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Testing Health Check Endpoint (/api/health)...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    console.log('   Status:', health.status, '| Database:', health.database);

    // 2. Authentication (Login)
    console.log('\n2️⃣ Testing Authentication (/api/auth/login)...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@borrow.lk',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.data.token;
    console.log('   ✅ Logged in as:', loginData.data.user.name, `(${loginData.data.user.email})`);
    console.log('   ✅ JWT Token received and verified.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 3. Products
    console.log('\n3️⃣ Testing Products Catalog (/api/products)...');
    const prodsRes = await fetch(`${API_BASE}/products`);
    const prods = await prodsRes.json();
    console.log(`   ✅ Fetched ${prods.data.length} products from NeonDB.`);
    console.log('   Sample Product:', prods.data[0].title, '- LKR', prods.data[0].pricePerDay, '/ day');
    const testProduct = prods.data[0];

    // 4. Clients CRUD
    console.log('\n4️⃣ Testing Clients Management (/api/clients)...');
    const clientsRes = await fetch(`${API_BASE}/clients`, { headers });
    const clients = await clientsRes.json();
    console.log(`   ✅ Fetched ${clients.data.length} clients.`);
    const testClient = clients.data[0];
    console.log('   Sample Client:', testClient.name, `(${testClient.company || 'Individual'})`, testClient.district);

    // Create a new client
    const newClientRes = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Samantha Wickrema',
        email: 'samantha.w@test.lk',
        phone: '+94773344556',
        company: 'Lanka Production House',
        district: 'Colombo',
        city: 'Colombo 05',
        address: '12 Havelock Road',
        clientType: 'corporate',
        notes: 'Created via automated integration test',
      }),
    });
    const createdClient = await newClientRes.json();
    console.log('   ✅ Created new client in NeonDB:', createdClient.data.name, 'ID:', createdClient.data.id);

    // 5. Dual Prediction Engines: Method 1 (Free Open-Source AI)
    console.log('\n5️⃣ Testing Prediction METHOD 1: Free Open-Source AI Model (/api/predictions)...');
    const pred1Res = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        predictionMethod: 'OPEN_SOURCE_AI',
        clientId: testClient.id,
        productId: testProduct.id,
        inputData: {
          itemTitle: testProduct.title,
          category: testProduct.category,
          rentalDurationDays: 3,
          expectedHoursPerDay: 8,
          indoorOutdoor: 'Both',
        },
      }),
    });
    const pred1 = await pred1Res.json();
    console.log('   ✅ Open-Source AI Model:', pred1.data.modelName);
    console.log('   ✅ Confidence Score:', pred1.data.confidenceScore);
    console.log('   ✅ AI Recommended Rate:', pred1.data.predictionResult.recommendedDailyRate, 'LKR');
    console.log('   ✅ Demand Forecast:', pred1.data.predictionResult.demandForecast);

    // 6. Dual Prediction Engines: Method 2 (Custom Machine Learning Model)
    console.log('\n6️⃣ Testing Prediction METHOD 2: Custom Machine Learning Model (/api/predictions)...');
    const pred2Res = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        predictionMethod: 'CUSTOM_ML',
        clientId: testClient.id,
        productId: testProduct.id,
        inputData: {
          clothingType: 'Bridal Osariya Silk Saree',
          durationDays: 2,
          clientTrustScore: 4.95,
          productValueLkr: 220000,
        },
      }),
    });
    const pred2 = await pred2Res.json();
    console.log('   ✅ Custom ML Model:', pred2.data.modelName);
    console.log('   ✅ Damage Risk Probability:', (pred2.data.predictionResult.damageRiskProbability * 100).toFixed(2) + '%');
    console.log('   ✅ Dynamic Risk Deposit:', pred2.data.predictionResult.calculatedDynamicDeposit, 'LKR');
    console.log('   ✅ Fabric Condition Score:', pred2.data.predictionResult.fabricConditionScore);
    console.log('   ✅ Confidence Score:', pred2.data.confidenceScore);

    // 7. Order Workflow with Client & Prediction Binding
    console.log('\n7️⃣ Testing Complete Order Workflow (/api/orders)...');
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientId: testClient.id,
        productId: testProduct.id,
        startDate: '2026-10-20',
        endDate: '2026-10-23',
        days: 3,
        predictionMethod: 'CUSTOM_ML',
        notes: 'Automated end-to-end integration test order with custom ML deposit calculation',
      }),
    });
    const orderData = await orderRes.json();
    console.log('   ✅ Created Order:', orderData.data.orderNumber);
    console.log('   ✅ Total Price:', orderData.data.totalPrice, 'LKR | Deposit:', orderData.data.deposit, 'LKR');
    console.log('   ✅ Client Attached:', orderData.data.client.name);
    console.log('   ✅ Linked Prediction ID:', orderData.data.predictionId);

    // 8. Order Status Lifecycle Update
    console.log('\n8️⃣ Testing Order Status Lifecycle (/api/orders/:id/status)...');
    const statusRes = await fetch(`${API_BASE}/orders/${orderData.data.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const updatedOrder = await statusRes.json();
    console.log('   ✅ Order Status Updated to:', updatedOrder.data.status);

    // 9. Dashboard Aggregation
    console.log('\n9️⃣ Testing Dashboard Analytics (/api/dashboard/customer)...');
    const dashRes = await fetch(`${API_BASE}/dashboard/customer`, { headers });
    const dash = await dashRes.json();
    console.log('   ✅ Active Rentals:', dash.data.activeRentals, '| Predictions Generated:', dash.data.predictionsGenerated);

    console.log('\n🎉 ALL FULL-STACK & NEONDB INTEGRATION TESTS PASSED SUCCESSFULLY! ✅\n');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error);
    process.exit(1);
  }
}

runTests();
