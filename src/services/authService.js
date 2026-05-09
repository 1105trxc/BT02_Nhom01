const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');
const User = require('../models/User');

/**
 * Service to handle Authentication logic
 */
class AuthService {
  /**
   * Generate a 6-digit random OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via Email
   */
  async sendOTPEmail(email, otpCode) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"UTEShop Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '[UTEShop] Mã OTP xác nhận quên mật khẩu',
        html: `
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
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false; // Still return false but log it
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
}

module.exports = new AuthService();
