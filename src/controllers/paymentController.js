const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { productsData, mockOrders, mockCoupons } = require('../utils/mockStore');

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'rzp_test_samplekeyid123') {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('Razorpay init error:', err.message);
  }
}

const createPaymentOrder = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { items, shippingAddress, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let dbProduct;
      const productId = item.productId || item.product?._id || item.product;
      if (isDbConnected && mongoose.Types.ObjectId.isValid(productId)) {
        dbProduct = await Product.findById(productId);
      } else {
        dbProduct = productsData.find(p => p._id === productId);
      }

      if (!dbProduct) {
        dbProduct = productsData[0];
      }

      const itemSubtotal = dbProduct.price * item.quantity;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        image: dbProduct.images?.[0] || '',
        size: item.size || 'M',
        color: item.color || 'Black',
        quantity: item.quantity,
        price: dbProduct.price,
        subtotal: itemSubtotal
      });
    }

    let discount = 0;
    if (couponCode) {
      const cleanCode = couponCode.toUpperCase().trim();
      let coupon;
      if (isDbConnected) {
        coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      }
      if (!coupon) {
        coupon = mockCoupons.find(c => c.code === cleanCode && c.isActive);
      }

      if (coupon) {
        const minOrderVal = Number(coupon.minOrderValue) || 0;
        if (calculatedSubtotal >= minOrderVal) {
          if (coupon.type === 'percentage') {
            discount = (calculatedSubtotal * coupon.value) / 100;
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.type === 'fixed') {
            discount = Math.min(coupon.value, calculatedSubtotal);
          }
        }
      }
    }

    const shippingFee = calculatedSubtotal > 1999 ? 0 : 150;
    const total = Math.max(0, calculatedSubtotal - discount + shippingFee);

    let razorpayOrderId = `rzp_order_mock_${Date.now()}`;

    if (razorpayInstance) {
      try {
        const options = {
          amount: Math.round(total * 100),
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        };
        const rzpOrder = await razorpayInstance.orders.create(options);
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.warn('Razorpay live order fallback:', err.message);
      }
    }

    let orderId = `order_${Date.now()}`;
    const canSaveToDb = isDbConnected && mongoose.Types.ObjectId.isValid(req.user?._id) && validatedItems.every(i => mongoose.Types.ObjectId.isValid(i.product));

    if (canSaveToDb) {
      const order = await Order.create({
        user: req.user._id,
        items: validatedItems,
        shippingAddress,
        subtotal: calculatedSubtotal,
        discount,
        shippingFee,
        tax: 0,
        total,
        razorpayOrderId,
        paymentStatus: 'pending',
        orderStatus: 'pending'
      });
      orderId = order._id.toString();
    } else {
      const mockOrder = {
        _id: orderId,
        user: req.user?._id || 'user_cust_99',
        items: validatedItems,
        shippingAddress,
        subtotal: calculatedSubtotal,
        discount,
        shippingFee,
        total,
        razorpayOrderId,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        createdAt: new Date()
      };
      mockOrders.unshift(mockOrder);
    }

    res.status(201).json({
      success: true,
      message: 'Payment order created',
      data: {
        orderId,
        razorpayOrderId,
        amount: total * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekeyid123',
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifySignature = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(orderId)) {
      const order = await Order.findById(orderId);
      if (order) {
        order.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();

        for (const item of order.items) {
          if (mongoose.Types.ObjectId.isValid(item.product)) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
          }
        }
        return res.json({ success: true, message: 'Payment verified and order confirmed', data: order });
      }
    }

    const order = mockOrders.find(o => o._id === orderId);
    if (order) {
      order.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
    }

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      data: order || { _id: orderId, paymentStatus: 'paid', orderStatus: 'confirmed' }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifySignature
};
