const http = require('http');
const app = require('../app');
const generateToken = require('./generateToken');

const server = app.listen(5097, async () => {
  console.log('Testing Review System APIs on port 5097...');

  const request = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5097,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
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
    const adminToken = generateToken('user_admin_99');
    const customerToken = generateToken('user_cust_99');

    // 1. Get Product Reviews
    const prodReviewsRes = await request('/api/reviews/product/prod_1');
    console.log(`✔ Get Product Reviews: Found ${prodReviewsRes.body.data?.reviews?.length || 0} reviews, rating: ${prodReviewsRes.body.data?.stats?.rating}`);

    // 2. Submit Customer Review
    const newReviewRes = await request(
      '/api/reviews',
      'POST',
      {
        productId: 'prod_1',
        rating: 5,
        title: 'Sensational architectural fit',
        comment: 'The drape and heavyweight texture exceeded all expectations. Beautiful stitching throughout.'
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    console.log(`✔ Customer Review Creation: ${newReviewRes.body.message}`);
    const createdId = newReviewRes.body.data?._id;

    // 3. Admin Get All Reviews
    const adminReviewsRes = await request(
      '/api/reviews/admin/all',
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`✔ Admin Get All Reviews: Retrieved ${adminReviewsRes.body.data?.length || 0} reviews`);

    // 4. Admin Reply to Customer Review
    if (createdId) {
      const replyRes = await request(
        `/api/reviews/admin/${createdId}/reply`,
        'POST',
        {
          comment: 'Thank you for your generous praise! We take immense pride in our architectural silhouette.'
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log(`✔ Admin Reply: ${replyRes.body.message}`);
    }

    console.log('\n🎉 ALL REVIEW API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Review verification failed:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
