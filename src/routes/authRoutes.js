const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter for sensitive Auth operations
 * Following UC03 Exception Flow: "Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau"
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  handler: (req, res) => {
    const { errorResponse } = require('../utils/responseHelper');
    return errorResponse(res, 'Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau', 429);
  }
});

// UC03: Forgot Password
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
