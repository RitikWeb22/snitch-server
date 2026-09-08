const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_fashion_brand_2026_change_in_production',
    { expiresIn: '30d' }
  );
};

module.exports = generateToken;
