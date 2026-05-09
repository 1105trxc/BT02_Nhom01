const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
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
