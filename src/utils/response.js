/**
 * Chuẩn hóa response format theo API Convention.
 * Mọi response đều có: success, code, message, data, timestamp.
 */

const success = (res, { statusCode = 200, message = 'Thành công', data = null }) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: Math.floor(Date.now() / 1000)
  });
};

const error = (res, { statusCode = 400, message = 'Có lỗi xảy ra', errors = null }) => {
  const body = {
    success: false,
    code: statusCode,
    message,
    data: null,
    timestamp: Math.floor(Date.now() / 1000)
  };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
