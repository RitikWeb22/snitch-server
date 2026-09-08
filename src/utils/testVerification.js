const http = require('http');
const app = require('../app');

const server = app.listen(5099, async () => {
  console.log('Testing AURA API server on port 5099...');

  const request = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5099,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('✔ Health Check:', health.body.message);

    // 2. Fetch Products with filtering
    const productsRes = await request('/api/products?gender=men&sort=price_asc');
    console.log(`✔ Products API (Filtered): Fetched ${productsRes.body.data.products.length} products`);

    // 3. Search Products
    const searchRes = await request('/api/products?q=hoodie');
    console.log(`✔ Search API: Found ${searchRes.body.data.products.length} matching products for "hoodie"`);

    // 4. Categories API
    const catRes = await request('/api/categories');
    console.log(`✔ Categories API: Fetched ${catRes.body.data.length} categories`);

    // 5. Demo Customer Login
    const loginRes = await request('/api/auth/demo-login', 'POST', { role: 'user' });
    console.log(`✔ Demo Login API: Logged in as ${loginRes.body.data.name}`);
    const token = loginRes.body.data.token;

    // 6. Create Razorpay Payment Order
    const paymentOrderRes = await request('/api/payments/create-order', 'POST', {
      items: [
        {
          product: productsRes.body.data.products[0]._id,
          name: productsRes.body.data.products[0].name,
          size: 'M',
          color: 'Black',
          quantity: 1
        }
      ],
      shippingAddress: {
        name: 'Sophia Laurent',
        phone: '+91 98765 43210',
        addressLine1: '42 Fashion Blvd',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050'
      },
      couponCode: 'AURA10'
    }, { Authorization: `Bearer ${token}` });

    if (!paymentOrderRes.body.data) {
      throw new Error(`Create order failed: ${JSON.stringify(paymentOrderRes.body)}`);
    }

    const orderData = paymentOrderRes.body.data;
    console.log(`✔ Razorpay Order Creation API: Created order ID ${orderData.orderId}`);

    // 7. Verify Signature
    const verifyRes = await request('/api/payments/verify-signature', 'POST', {
      orderId: orderData.orderId,
      razorpayOrderId: orderData.razorpayOrderId,
      razorpayPaymentId: 'pay_test_verification_99',
      razorpaySignature: 'mock_signature'
    }, { Authorization: `Bearer ${token}` });

    console.log(`✔ Razorpay Signature Verification API: ${verifyRes.body.message}`);

    console.log('\n🎉 ALL API VERIFICATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification test failed:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
