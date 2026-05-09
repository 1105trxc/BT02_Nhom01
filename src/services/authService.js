const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * AuthService.authenticate(email, password)
 * 
 * Luồng theo Sequence Diagram UC02:
 * 1. UserRepo.findByEmail(email)        → tìm user trong DB
 * 2. BCrypt.compare(password, hash)      → so sánh mật khẩu
 * 3. Nếu sai → recordFailure (tăng failed_login_attempts, khóa nếu >= 5)
 * 4. Nếu đúng → JwtService.signJwt(userId, role) → trả token + redirectUrl
 */
const authenticate = async (email, password) => {
  // ── UserRepo.findByEmail(email) ──
  const user = await User.findOne({ email });

  if (!user) {
    // User not found → Invalid credentials
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  // Kiểm tra tài khoản đang bị khóa tạm thời (lockout_until)
  if (user.lockout_until && new Date() < user.lockout_until) {
    const remainMinutes = Math.ceil((user.lockout_until - new Date()) / (60 * 1000));
    throw new Error(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${remainMinutes} phút`);
  }

  // Kiểm tra trạng thái tài khoản bị admin khóa vĩnh viễn
  if (user.status === 'locked') {
    throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
  }
  if (user.status === 'inactive') {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }

  // ── BCrypt.compare(password, passwordHash) ──
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    // Password mismatch → recordFailure(email)
    user.failed_login_attempts += 1;

    if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
      user.lockout_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await user.save();
      throw new Error(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${LOCKOUT_MINUTES} phút`);
    }

    await user.save();
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  // ── Password match → reset counter ──
  user.failed_login_attempts = 0;
  user.lockout_until = null;
  await user.save();

  // ── JwtService.signJwt(userId, role) ──
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Xác định redirectUrl theo role (từ diagram)
  const redirectUrl = user.role === 'admin' ? '/admin/profile' : '/user/profile';

  // Loại bỏ password + chuyển sang camelCase (API Convention §1)
  const userObj = user.toObject();
  const userData = {
    id: userObj._id,
    fullName: userObj.full_name,
    email: userObj.email,
    phone: userObj.phone || null,
    role: userObj.role,
    studentId: userObj.student_id || null,
    faculty: userObj.faculty || null,
    avatarUrl: userObj.avatar_url || null,
    status: userObj.status,
    coinBalance: userObj.coin_balance,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };

  return { token, user: userData, redirectUrl };
};

module.exports = { authenticate };
