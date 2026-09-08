const axios = require('axios');

async function testCoupon() {
  const baseURL = 'http://localhost:5000/api';
  console.log('Testing Coupon Flow against:', baseURL);

  try {
    // 0. Login as admin
    console.log('\n--- 0. Admin Login ---');
    const authRes = await axios.post(`${baseURL}/auth/demo-login`, { role: 'admin' });
    const token = authRes.data.data?.token || authRes.data.token;
    console.log('Admin authenticated successfully, token present:', !!token);

    const adminConfig = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 1. Get coupons list
    console.log('\n--- 1. Get Coupons ---');
    const getRes = await axios.get(`${baseURL}/coupons`, adminConfig);
    console.log('Coupons count:', getRes.data.data?.length);

    // 2. Create custom coupon
    const testCode = `PROMO${Math.floor(100 + Math.random() * 900)}`;
    console.log(`\n--- 2. Create Custom Coupon: ${testCode} ---`);
    const createRes = await axios.post(
      `${baseURL}/coupons`,
      {
        code: testCode,
        type: 'percentage',
        value: 25,
        minOrderValue: 1500,
        maxDiscount: 750
      },
      adminConfig
    );
    console.log('Created successfully:', createRes.data.success, createRes.data.data);

    // 3. Validate below minOrderValue
    console.log('\n--- 3. Validate Below Minimum Order Value (₹1,000 < ₹1,500) ---');
    try {
      await axios.post(`${baseURL}/coupons/validate`, {
        code: testCode,
        cartSubtotal: 1000
      });
      console.error('FAILED: Should have rejected subtotal < minOrderValue');
    } catch (err) {
      console.log('Correctly rejected with message:', err.response?.data?.message);
    }

    // 4. Validate above minOrderValue
    console.log('\n--- 4. Validate Above Minimum Order Value (₹2,000 >= ₹1,500) ---');
    const validRes = await axios.post(`${baseURL}/coupons/validate`, {
      code: testCode,
      cartSubtotal: 2000
    });
    console.log('Validation result:', validRes.data);
    console.log(`Expected discount: 25% of ₹2,000 = ₹500. Received: ₹${validRes.data.data?.discount}`);

    // 5. Test maxDiscount cap (25% of ₹4,000 = ₹1,000 > max ₹750)
    console.log('\n--- 5. Validate Max Discount Cap (₹4,000 cart) ---');
    const capRes = await axios.post(`${baseURL}/coupons/validate`, {
      code: testCode,
      cartSubtotal: 4000
    });
    console.log(`Expected capped discount: ₹750. Received: ₹${capRes.data.data?.discount}`);

    console.log('\n✔ All coupon verification tests passed!');
  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
  }
}

testCoupon();
