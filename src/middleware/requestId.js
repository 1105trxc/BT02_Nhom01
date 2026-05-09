const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to attach a unique requestId to each request
 * Following .antigravity/API_CONVENTION.md
 */
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.header('X-Request-Id') || uuidv4();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
const requestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

module.exports = requestId;
