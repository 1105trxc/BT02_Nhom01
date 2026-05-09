const User = require('../models/User');
const OTP = require('../models/OTP');
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Controller to handle Authentication requests
 */
class AuthController {
  /**
   * UC03: Request Forgot Password OTP
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, 'Email is required', 422, { email: 'Email is required' });
      }

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Business Rule: Standardize response even if user doesn't exist for security? 
        // But UC03 says "Email không tồn tại: Hệ thống báo lỗi 'Tài khoản Email không tồn tại'"
        return errorResponse(res, 'Tài khoản Email không tồn tại', 422, { email: 'Email does not exist' });
      }

      // Generate OTP
      const otpCode = authService.generateOTP();
      const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to DB
      await OTP.create({
        email,
        otp_code: otpCode,
        otp_type: 'reset_password',
        expired_at: expiredAt
      });

      // Send Email
      await authService.sendOTPEmail(email, otpCode);

      return successResponse(res, 'Mã OTP đã được gửi về email của bạn');
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return errorResponse(res, 'Internal Server Error', 500);
    }
  }

  /**
   * UC03: Reset Password using OTP
   */
  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      // Basic Validation
      const errors = {};
      if (!email) errors.email = 'Email is required';
      if (!otp) errors.otp = 'OTP is required';
      if (!newPassword) errors.newPassword = 'New Password is required';
      
      if (Object.keys(errors).length > 0) {
        return errorResponse(res, 'Validation failed', 422, errors);
      }

      // Business Rule: Mật khẩu bắt buộc phải có độ dài tối thiểu 8 ký tự, có chữ số và ký tự đặc biệt
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return errorResponse(res, 'Mật khẩu phải từ 8 ký tự, bao gồm chữ số và ký tự đặc biệt', 422, {
          newPassword: 'Password does not meet security requirements'
        });
      }

      // Verify OTP
      const isValid = await authService.verifyOTP(email, otp, 'reset_password');
      if (!isValid) {
        return errorResponse(res, 'Mã OTP không chính xác hoặc đã hết hạn', 422, {
          otp: 'Invalid or expired OTP'
        });
      }

      // Update User Password
      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      user.password = await authService.hashPassword(newPassword);
      await user.save();

      return successResponse(res, 'Mật khẩu đã được cập nhật thành công');
    } catch (error) {
      console.error('Reset Password Error:', error);
      return errorResponse(res, 'Internal Server Error', 500);
    }
  }
}

module.exports = new AuthController();
