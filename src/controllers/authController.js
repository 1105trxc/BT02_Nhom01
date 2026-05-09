const User = require('../models/User');
const OTP = require('../models/OTP');
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Controller to handle Authentication requests (UC01, UC02, UC03)
 */
class AuthController {
  /**
   * UC01: Send OTP for registration
   */
  async sendOTP(req, res, next) {
    try {
      const { email } = req.body;
      await authService.sendRegistrationOTP(email);
      
      return successResponse(res, 'Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC01: Register new user
   */
  async register(req, res, next) {
    try {
      const { full_name, email, password, otp_code } = req.body;

      const result = await authService.registerUser({
        full_name,
        email,
        password,
        otp_code
      });

      return res.status(201).json({
        success: true,
        code: 201,
        message: 'Đăng ký tài khoản thành công',
        data: {
          token: result.token,
          user: {
            id: result.user._id,
            full_name: result.user.full_name,
            email: result.user.email,
            role: result.user.role
          }
        },
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC02: Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.authenticate(email, password);

      return successResponse(res, 'Đăng nhập thành công', {
        token: result.token,
        user: result.user,
        redirectUrl: result.redirectUrl
      });
    } catch (err) {
      return errorResponse(res, err.message, 401);
    }
  }

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

      // Security requirement: Minimum 8 characters, with numbers and special characters
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
