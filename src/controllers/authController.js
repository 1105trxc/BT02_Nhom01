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
const authService = require('../services/authService');
const response = require('../utils/response');

/**
 * AuthController - POST /auth/login
 * 
 * Luồng theo Sequence Diagram UC02:
 * 1. ValidationMW đã chạy trước (middleware chain)
 * 2. RateLimitMW đã chạy trước (middleware chain)
 * 3. Gọi AuthService.authenticate(email, password)
 * 4. Trả về 200 {token, redirectUrl} hoặc 401 lỗi
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // AuthService.authenticate(email, password)
    const result = await authService.authenticate(email, password);

    // 200 {token, user, redirectUrl}
    return response.success(res, {
      message: 'Đăng nhập thành công',
      data: {
        token: result.token,
        user: result.user,
        redirectUrl: result.redirectUrl
      }
    });
  } catch (err) {
    // 401 Invalid email or password (hoặc account locked)
    return response.error(res, {
      statusCode: 401,
      message: err.message
    });
  }
};

module.exports = { login };

/**
 * @desc    Send OTP for registration
 * @route   POST /api/auth/register/send-otp
 * @access  Public
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    await authService.sendRegistrationOTP(email);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, otp_code } = req.body;

    const result = await authService.registerUser({
      full_name,
      email,
      password,
      otp_code
    });

    res.status(201).json({
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
};
