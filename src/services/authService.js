const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const User = require('../models/User');
const sendEmail = require('../utils/mail');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Service to handle Authentication logic (Registration, Login, Password Reset)
 */
class AuthService {
  /**
   * Generate a 6-digit random OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via Email for Password Reset
   */
  async sendOTPEmail(email, otpCode) {
    try {
      const subject = '[UTEShop] Mã OTP xác nhận quên mật khẩu';
      const message = `Mã xác thực OTP của bạn là: ${otpCode}. Mã có hiệu lực trong 10 phút.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50; text-align: center;">Xác thực tài khoản UTEShop</h2>
          <p>Chào bạn,</p>
          <p>Bạn đã yêu cầu thiết lập lại mật khẩu cho tài khoản UTEShop. Dưới đây là mã OTP của bạn:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>Mã này có hiệu lực trong <b>10 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      `;

      await sendEmail({ email, subject, message, html });
      console.log(`✅ Email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Hash password using BCrypt
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Verify OTP from database
   */
  async verifyOTP(email, otpCode, type) {
    const otpRecord = await OTP.findOne({
      email,
      otp_code: otpCode,
      otp_type: type,
      is_verified: false,
      expired_at: { $gt: new Date() }
    });

    if (!otpRecord) return false;

    // Mark as used
    otpRecord.is_verified = true;
    await otpRecord.save();
    return true;
  }

  /**
   * UC02: Authenticate user login
   */
  async authenticate(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // Check temporary lockout
    if (user.lockout_until && new Date() < user.lockout_until) {
      const remainMinutes = Math.ceil((user.lockout_until - new Date()) / (60 * 1000));
      throw new Error(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${remainMinutes} phút`);
    }

    // Check permanent lockout or inactivity
    if (user.status === 'locked') {
      throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
    }
    if (user.status === 'inactive') {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failed_login_attempts += 1;

      if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        user.lockout_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await user.save();
        throw new Error(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${LOCKOUT_MINUTES} phút`);
      }

      await user.save();
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // Password match -> reset counter
    user.failed_login_attempts = 0;
    user.lockout_until = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const redirectUrl = user.role === 'admin' ? '/admin/profile' : '/user/profile';

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
  }

  /**
   * UC01: Send OTP for Registration
   */
  async sendRegistrationOTP(email) {
    const userExists = await User.findOne({ email });
    if (userExists && userExists.status === 'active') {
      const error = new Error('Email này đã được đăng ký và đang hoạt động. Vui lòng đăng nhập.');
      error.statusCode = 422;
      throw error;
    }

    const otpCode = this.generateOTP();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({
      email,
      otp_code: otpCode,
      otp_type: 'register',
      expired_at: expiredAt
    });

    const subject = '[UTEShop] Mã xác thực đăng ký tài khoản';
    const message = `Mã xác thực OTP của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #007bff; text-align: center;">Xác thực Đăng ký UTEShop</h2>
        <p>Chào bạn,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại UTEShop. Đây là mã OTP của bạn:</p>
        <div style="font-size: 24px; font-weight: bold; color: #333; text-align: center; padding: 15px; background: #f4f4f4; border-radius: 5px; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">Mã này sẽ hết hạn sau 5 phút.</p>
        <hr>
        <p style="font-size: 12px; color: #999; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
      </div>
    `;

    await sendEmail({ email, subject, message, html });
    return true;
  }

  /**
   * UC01: Verify OTP and Register User
   */
  async registerUser(userData) {
    const { full_name, email, password, otp_code } = userData;

    const otpRecord = await OTP.findOne({
      email,
      otp_code,
      otp_type: 'register',
      expired_at: { $gt: new Date() },
      is_verified: false
    });

    if (!otpRecord) {
      const error = new Error('Mã OTP không chính xác hoặc đã hết hạn');
      error.statusCode = 422;
      throw error;
    }

    const userExists = await User.findOne({ email });
    if (userExists && userExists.status === 'active') {
      const error = new Error('Email đã được đăng ký tài khoản');
      error.statusCode = 422;
      throw error;
    }

    otpRecord.is_verified = true;
    await otpRecord.save();

    const hashedPassword = await this.hashPassword(password);

    let student_id = '';
    const domain = email.split('@')[1];
    if (domain === 'student.hcmute.edu.vn') {
      student_id = email.split('@')[0];
    }

    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      student_id,
      role: 'customer',
      status: 'active',
      email_verified_at: new Date(),
      coin_balance: 0
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return { user, token };
  }
}

module.exports = new AuthService();
