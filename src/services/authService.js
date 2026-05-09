const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/mail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP for Registration
 */
exports.sendRegistrationOTP = async (email) => {
  console.log(`[TRACING] Sending Registration OTP to: ${email}`);

  // Check if user already exists and is active
  const userExists = await User.findOne({ email });
  if (userExists) {
    if (userExists.status === 'active') {
      console.warn(`[TRACING] Attempt to register an already active email: ${email}`);
      const error = new Error('Email này đã được đăng ký và đang hoạt động. Vui lòng đăng nhập.');
      error.statusCode = 422;
      throw error;
    }
    // If user exists but is pending/inactive, we might allow re-sending OTP? 
    // In this flow, we'll allow it.
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  // Save OTP to DB
  try {
    await OTP.create({
      email,
      otp_code: otpCode,
      otp_type: 'register',
      expired_at: expiredAt
    });
    console.log(`[TRACING] OTP ${otpCode} stored for ${email}`);
  } catch (dbError) {
    console.error(`[TRACING] Database error storing OTP: ${dbError.message}`);
    throw dbError;
  }

  // Send Email
  try {
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

    await sendEmail({
      email,
      subject: '[UTEShop] Mã xác thực đăng ký tài khoản',
      message,
      html
    });
    console.log(`[TRACING] OTP Email successfully sent to ${email}`);
  } catch (mailError) {
    console.error(`[TRACING] Failed to send OTP email to ${email}: ${mailError.message}`);
    const error = new Error('Không thể gửi email xác thực. Vui lòng thử lại sau.');
    error.statusCode = 500;
    throw error;
  }

  return true;
};

/**
 * Verify OTP and Create User
 */
exports.registerUser = async (userData) => {
  const { full_name, email, password, otp_code } = userData;
  console.log(`[TRACING] Attempting to register user: ${email}`);

  // 1. Verify OTP
  const otpRecord = await OTP.findOne({
    email,
    otp_code,
    otp_type: 'register',
    expired_at: { $gt: new Date() },
    is_verified: false
  });

  if (!otpRecord) {
    console.warn(`[TRACING] Invalid or expired OTP attempt for: ${email}`);
    const error = new Error('Mã OTP không chính xác hoặc đã hết hạn');
    error.statusCode = 422;
    throw error;
  }

  // 2. Double check if user was created by another process in the meantime
  const userExists = await User.findOne({ email });
  if (userExists && userExists.status === 'active') {
    console.error(`[TRACING] Race condition: User ${email} already registered.`);
    const error = new Error('Email đã được đăng ký tài khoản');
    error.statusCode = 422;
    throw error;
  }

  // 3. Mark OTP as verified
  otpRecord.is_verified = true;
  await otpRecord.save();
  console.log(`[TRACING] OTP verified for: ${email}`);

  // 4. Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 5. Extract student_id if email is from student domain
  let student_id = '';
  const domain = email.split('@')[1];
  if (domain === 'student.hcmute.edu.vn') {
    student_id = email.split('@')[0];
  }

  // 6. Create User
  try {
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
    console.log(`[TRACING] User successfully created: ${email} (ID: ${user._id})`);

    // 7. Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return { user, token };
  } catch (dbError) {
    console.error(`[TRACING] Database error creating user: ${dbError.message}`);
    throw dbError;
  }
};
