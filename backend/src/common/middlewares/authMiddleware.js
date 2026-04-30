const AppError = require('../errors/AppError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../../modules/users/user.model');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No autenticado', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    return next(new AppError('Token invalido o expirado', 401));
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id };
  } catch (err) {
    req.user = null;
  }

  return next();
};

const adminMiddleware = async (req, res, next) => {
  if (!req.user?.id) {
    return next(new AppError('No autenticado', 401));
  }

  const user = await User.findById(req.user.id).select('role');
  if (!user) {
    return next(new AppError('Usuario no encontrado', 404));
  }

  if (user.role !== 'admin') {
    return next(new AppError('Permisos insuficientes', 403));
  }

  req.user.role = user.role;
  return next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
};
