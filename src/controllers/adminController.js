const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { mockReviews } = require('../utils/mockStore');
const mongoose = require('mongoose');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    let totalUsers = 24;
    let totalProducts = 16;
    let totalOrders = 12;
    let totalRevenue = 48500;
    let recentOrders = [];
    let lowStockProducts = [];
    let totalReviews = mockReviews.length;
    let recentReviews = mockReviews.slice(0, 4);

    if (isDbConnected) {
      totalUsers = await User.countDocuments();
      totalProducts = await Product.countDocuments();
      totalOrders = await Order.countDocuments();

      const paidOrders = await Order.find({ paymentStatus: 'paid' });
      totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

      recentOrders = await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

      lowStockProducts = await Product.find({ stock: { $lte: 5 } }).limit(5);

      totalReviews = await Review.countDocuments();
      recentReviews = await Review.find()
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .limit(4);
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders,
        lowStockProducts,
        totalReviews,
        recentReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers
};
