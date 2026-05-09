const jwt = require('jsonwebtoken');
const response = require('../utils/response');

/**
 * Middleware xác thực JWT token.
 * Gắn user info vào req.user nếu token hợp lệ.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.error(res, {
      statusCode: 401,
      message: 'Unauthorized - Vui lòng đăng nhập'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return response.error(res, {
      statusCode: 401,
      message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại'
    });
  }
};

module.exports = { verifyToken };
