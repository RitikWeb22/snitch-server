const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifySignature } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-signature', protect, verifySignature);

module.exports = router;
