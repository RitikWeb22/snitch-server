const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const { mockCoupons } = require('../utils/mockStore');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      return res.json({ success: true, data: coupons });
    }
    res.json({ success: true, data: mockCoupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, minOrderValue, maxDiscount, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, type, and value are required' });
    }

    const cleanCode = code.toUpperCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const existing = await Coupon.findOne({ code: cleanCode });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon code already exists' });
      }

      const coupon = await Coupon.create({
        code: cleanCode,
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      });

      // Also sync into mockCoupons for fast fallback
      mockCoupons.unshift({
        _id: coupon._id.toString(),
        code: cleanCode,
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        expiresAt: coupon.expiresAt,
        isActive: true
      });

      return res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
    }

    const existing = mockCoupons.find(c => c.code === cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const newCoupon = {
      _id: `coup_${Date.now()}`,
      code: cleanCode,
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true
    };

    mockCoupons.unshift(newCoupon);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: newCoupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
      const idx = mockCoupons.findIndex(c => c._id === req.params.id || c.code === coupon.code);
      if (idx !== -1) mockCoupons.splice(idx, 1);
      return res.json({ success: true, message: 'Coupon deleted' });
    }

    const idx = mockCoupons.findIndex(c => c._id === req.params.id);
    if (idx !== -1) mockCoupons.splice(idx, 1);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon code (Public / User)
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartSubtotal = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const cleanCode = code.toUpperCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    let coupon;
    if (isDbConnected) {
      coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    }
    if (!coupon) {
      coupon = mockCoupons.find(c => c.code === cleanCode && c.isActive);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    const subtotal = Number(cartSubtotal) || 0;
    const minOrderVal = Number(coupon.minOrderValue) || 0;

    if (subtotal < minOrderVal) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for coupon ${cleanCode} is ₹${minOrderVal.toLocaleString('en-IN')}`
      });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    }

    res.json({
      success: true,
      message: `Coupon ${coupon.code} applied successfully`,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        minOrderValue: coupon.minOrderValue || 0,
        maxDiscount: coupon.maxDiscount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon
};
