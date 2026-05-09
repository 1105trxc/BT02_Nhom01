const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users/profile
 * @desc    Lấy thông tin cá nhân hiện tại
 * @access  Private
 */
router.get('/profile', verifyToken, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật thông tin cá nhân (UC04)
 * @access  Private
 */
router.put('/profile', verifyToken, userController.updateProfile);

module.exports = router;
