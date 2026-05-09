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

module.exports = router;
