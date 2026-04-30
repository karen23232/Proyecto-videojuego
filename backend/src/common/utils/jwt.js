const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtAccessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
