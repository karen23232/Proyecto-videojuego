const authService = require('./auth.service');
const response = require('../../common/utils/response');
const { refreshCookieName, refreshCookieOptions } = require('../../common/utils/cookies');

const register = async (req, res) => {
  const data = await authService.register(req.body);
  res.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);
  delete data.refreshToken;
  return response.ok(res, data, data.message, 201);
};

const login = async (req, res) => {
  const data = await authService.login(req.body);
  res.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);
  delete data.refreshToken;
  return response.ok(res, data, data.message);
};

const me = async (req, res) => {
  const data = await authService.me(req.headers.authorization);
  return response.ok(res, data);
};

const refresh = async (req, res) => {
  const data = await authService.refresh(req.cookies[refreshCookieName]);
  res.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);
  delete data.refreshToken;
  return response.ok(res, data, data.message);
};

const logout = async (req, res) => {
  const data = await authService.logout(req.cookies[refreshCookieName]);
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  return response.ok(res, {}, data.message);
};

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
};
