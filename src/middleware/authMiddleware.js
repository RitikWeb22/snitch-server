const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_fashion_brand_2026_change_in_production'
    );

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Hybrid fallback user if DB is disconnected or demo/local user
    req.user = {
      _id: decoded.id || 'user_cust_99',
      name: decoded.id === 'user_admin_99' ? 'Maison Vogue Admin' : 'Sophia Laurent',
      email: decoded.id === 'user_admin_99' ? 'admin@maisonvogue.fashion' : 'customer@maisonvogue.fashion',
      role: decoded.id === 'user_admin_99' ? 'admin' : 'user',
      addresses: [],
      wishlist: []
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed'
    });
  }
};

module.exports = { protect };
