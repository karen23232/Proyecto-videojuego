const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  },
});

module.exports = globalRateLimiter;
