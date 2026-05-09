/**
 * Response Helper to ensure standard API Envelope
 * Following .antigravity/API_CONVENTION.md
 */

const sendResponse = (res, { success, code, message, data = null, errors = null, requestId = null }) => {
  const response = {
    success,
    code,
    message,
    data,
    timestamp: Math.floor(Date.now() / 1000)
  };

  if (errors) response.errors = errors;
  if (requestId) response.requestId = requestId;

  return res.status(code).json(response);
};

const successResponse = (res, message, data = null, code = 200) => {
  return sendResponse(res, {
    success: true,
    code,
    message,
    data,
    requestId: res.locals.requestId
  });
};

const errorResponse = (res, message, code = 400, errors = null) => {
  return sendResponse(res, {
    success: false,
    code,
    message,
    errors,
    requestId: res.locals.requestId
  });
};

module.exports = {
  successResponse,
  errorResponse
};
