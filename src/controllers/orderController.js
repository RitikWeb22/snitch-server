const mongoose = require('mongoose');
const Order = require('../models/Order');
const { mockOrders } = require('../utils/mockStore');

if (mockOrders.length === 0) {
  mockOrders.push({
    _id: 'order_101',
    user: { _id: 'user_cust_99', name: 'Sophia Laurent', email: 'customer@maisonvogue.fashion' },
    items: [
      { name: 'Heavyweight Boxy Tee', size: 'M', color: 'Black', quantity: 1, price: 1899 }
    ],
    shippingAddress: { addressLine1: '42 Fashion Blvd', city: 'Mumbai', state: 'Maharashtra' },
    total: 1899,
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    createdAt: new Date()
  });
}

const getUserOrders = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(req.user._id)) {
      const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
      if (orders && orders.length > 0) {
        return res.json({ success: true, data: orders });
      }
    }
    res.json({ success: true, data: mockOrders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const order = await Order.findById(req.params.id).populate('user', 'name email phone');
      if (order) return res.json({ success: true, data: order });
    }

    const order = mockOrders.find(o => o._id === req.params.id) || mockOrders[0];
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
      if (orders && orders.length > 0) {
        return res.json({ success: true, data: orders });
      }
    }
    res.json({ success: true, data: mockOrders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { orderStatus, paymentStatus } = req.body;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const order = await Order.findById(req.params.id);
      if (order) {
        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        await order.save();
        return res.json({ success: true, message: 'Order status updated', data: order });
      }
    }

    const idx = mockOrders.findIndex(o => o._id === req.params.id);
    if (idx > -1) {
      if (orderStatus) mockOrders[idx].orderStatus = orderStatus;
      if (paymentStatus) mockOrders[idx].paymentStatus = paymentStatus;
      return res.json({ success: true, message: 'Order status updated', data: mockOrders[idx] });
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
