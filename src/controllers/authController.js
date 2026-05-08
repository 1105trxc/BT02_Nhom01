const authService = require('../services/authService');

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
