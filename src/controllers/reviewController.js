const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { mockReviews, productsData } = require('../utils/mockStore');

// Helper to compute 5-star distribution breakdown
const calculateDistribution = (reviews) => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.round(r.rating);
    if (counts[star] !== undefined) counts[star]++;
  });
  const total = reviews.length;
  const percentages = {
    5: total > 0 ? Math.round((counts[5] / total) * 100) : 0,
    4: total > 0 ? Math.round((counts[4] / total) * 100) : 0,
    3: total > 0 ? Math.round((counts[3] / total) * 100) : 0,
    2: total > 0 ? Math.round((counts[2] / total) * 100) : 0,
    1: total > 0 ? Math.round((counts[1] / total) * 100) : 0
  };
  return { counts, percentages, total };
};

// @desc    Get reviews for a product with breakdown stats
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(productId)) {
      const reviews = await Review.find({ product: productId, status: 'approved' })
        .sort({ createdAt: -1 })
        .populate('user', 'name avatar');

      const product = await Product.findById(productId).select('name rating reviewCount');
      const avgRating =
        reviews.length > 0
          ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
          : product?.rating || 4.5;

      const distribution = calculateDistribution(reviews);

      return res.json({
        success: true,
        data: {
          reviews,
          stats: {
            rating: avgRating,
            reviewCount: reviews.length,
            distribution
          }
        }
      });
    }

    // Offline / Mock Store Fallback
    const filtered = mockReviews.filter(
      (r) => r.product === productId || r.product?._id === productId || r.product === 'prod_1'
    );
    const avgRating =
      filtered.length > 0
        ? Math.round((filtered.reduce((acc, r) => acc + r.rating, 0) / filtered.length) * 10) / 10
        : 4.8;

    const distribution = calculateDistribution(filtered);

    res.json({
      success: true,
      data: {
        reviews: filtered,
        stats: {
          rating: avgRating,
          reviewCount: filtered.length,
          distribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rating, title, and comment.'
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5.'
      });
    }

    const reviewerName = req.user?.name || 'Valued Customer';
    const reviewerEmail = req.user?.email || 'customer@maisonvogue.fashion';

    if (isDbConnected && mongoose.Types.ObjectId.isValid(productId) && mongoose.Types.ObjectId.isValid(req.user?._id)) {
      // Check if user already reviewed
      const existing = await Review.findOne({ product: productId, user: req.user._id });
      if (existing) {
        existing.rating = numRating;
        existing.title = title;
        existing.comment = comment;
        await existing.save();

        return res.json({
          success: true,
          message: 'Your review has been updated successfully',
          data: existing
        });
      }

      const review = await Review.create({
        product: productId,
        user: req.user._id,
        name: reviewerName,
        rating: numRating,
        title,
        comment,
        verifiedPurchase: true,
        status: 'approved'
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your review has been published.',
        data: review
      });
    }

    // Mock Store Fallback
    const targetProduct = productsData.find((p) => p._id === productId) || productsData[0];
    const newReview = {
      _id: `rev_${Date.now()}`,
      product: productId,
      productName: targetProduct?.name || 'Heavyweight Boxy Tee',
      productImage: targetProduct?.images?.[0] || '',
      user: req.user?._id || 'user_cust_99',
      name: reviewerName,
      email: reviewerEmail,
      rating: numRating,
      title,
      comment,
      verifiedPurchase: true,
      status: 'approved',
      createdAt: new Date(),
      adminReply: {
        comment: '',
        repliedAt: null,
        repliedBy: ''
      }
    };

    mockReviews.unshift(newReview);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for Admin Console
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAdminReviews = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .populate('product', 'name images price slug')
        .populate('user', 'name email avatar');

      return res.json({
        success: true,
        data: reviews
      });
    }

    // Mock store
    res.json({
      success: true,
      data: mockReviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reply to a customer review
// @route   POST /api/reviews/admin/:id/reply
// @access  Private/Admin
const replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Reply comment cannot be empty' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      review.adminReply = {
        comment: comment.trim(),
        repliedAt: new Date(),
        repliedBy: req.user?.name || 'Maison Vogue Concierge'
      };

      await review.save();

      return res.json({
        success: true,
        message: 'Admin response published successfully',
        data: review
      });
    }

    // Mock store
    const review = mockReviews.find((r) => r._id === id);
    if (review) {
      review.adminReply = {
        comment: comment.trim(),
        repliedAt: new Date(),
        repliedBy: req.user?.name || 'Maison Vogue Concierge'
      };
      return res.json({
        success: true,
        message: 'Admin response published successfully',
        data: review
      });
    }

    res.status(404).json({ success: false, message: 'Review not found' });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete review
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
      const review = await Review.findById(id);
      if (review) {
        const prodId = review.product;
        await Review.findByIdAndDelete(id);
        await Review.getAverageRating(prodId);
        return res.json({ success: true, message: 'Review removed successfully' });
      }
    }

    const idx = mockReviews.findIndex((r) => r._id === id);
    if (idx > -1) {
      mockReviews.splice(idx, 1);
      return res.json({ success: true, message: 'Review removed successfully' });
    }

    res.json({ success: true, message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getAdminReviews,
  replyToReview,
  deleteReview
};
