const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, mergeCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/items/:itemId', protect, updateCartItem);
router.delete('/items/:itemId', protect, removeCartItem);
router.post('/merge', protect, mergeCart);

module.exports = router;
