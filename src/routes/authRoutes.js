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
  max: 10000, // Limit each IP to 10000 requests per windowMs
  handler: (req, res) => {
    const { errorResponse } = require('../utils/responseHelper');
    return errorResponse(res, 'Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau', 429);
  }
});

// UC03: Forgot Password
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
const { loginRules, handleValidation } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/login
 * 
 * Middleware chain theo Sequence Diagram:
 * 1. loginLimiter         → RateLimitMiddleware.checkLoginAttempts(email, ip)
 * 2. loginRules           → ValidationMiddleware.validateRequired(email, password)
 * 3. handleValidation     → Trả 400 nếu validation fail
 * 4. authController.login → AuthController → AuthService.authenticate()
 */
router.post('/login', loginLimiter, loginRules, handleValidation, authController.login);
const { validate } = require('../middleware/validator');
const { registrationRules, sendOTPRules } = require('../middleware/authValidator');

// Đăng ký
router.post(
  '/register/send-otp',
  sendOTPRules(),
  validate,
  authController.sendOTP
);

router.post(
  '/register',
  registrationRules(),
  validate,
  authController.register
);

module.exports = router;
