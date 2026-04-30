const env = require('../../config/env');

const refreshCookieName = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  refreshCookieName,
  refreshCookieOptions,
};
