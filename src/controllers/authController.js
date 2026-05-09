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
