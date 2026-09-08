const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getAdminReviews,
  replyToReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public route to get reviews for a product
router.get('/product/:productId', getProductReviews);

// Protected customer route to submit review
router.post('/', protect, createReview);

// Protected admin routes
router.get('/admin/all', protect, adminOnly, getAdminReviews);
router.post('/admin/:id/reply', protect, adminOnly, replyToReview);
router.delete('/admin/:id', protect, adminOnly, deleteReview);

module.exports = router;
