const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/users/profile
 * @desc    Lấy thông tin cá nhân hiện tại
 * @access  Private
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật thông tin cá nhân (UC04)
 * @access  Private
 */
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
