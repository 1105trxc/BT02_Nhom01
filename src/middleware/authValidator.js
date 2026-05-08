const { body } = require('express-validator');

const registrationRules = () => {
  return [
    body('full_name')
      .notEmpty().withMessage('Họ tên không được để trống')
      .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự'),
    
    body('email')
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không đúng định dạng'),
    
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống')
      .isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'),
    
    body('otp_code')
      .notEmpty().withMessage('Mã OTP không được để trống')
      .isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có đúng 6 chữ số')
      .isNumeric().withMessage('Mã OTP chỉ bao gồm số')
  ];
};

const sendOTPRules = () => {
  return [
    body('email')
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không đúng định dạng')
  ];
};

module.exports = {
  registrationRules,
  sendOTPRules
};
