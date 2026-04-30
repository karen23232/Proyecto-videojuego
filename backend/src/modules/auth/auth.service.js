const bcrypt = require('bcryptjs');
const AppError = require('../../common/errors/AppError');
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../../common/utils/jwt');
const authRepository = require('./auth.repository');

const buildAuthPayload = async (user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await authRepository.updateRefreshTokenHash(user._id, refreshTokenHash);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

const register = async ({ username, email, password, confirmPassword }) => {
  if (!username || !email || !password || !confirmPassword) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Las contrasenas no coinciden', 400);
  }

  if (password.length < 6) {
    throw new AppError('La contrasena debe tener al menos 6 caracteres', 400);
  }

  const existingEmail = await authRepository.findByEmail(email);
  if (existingEmail) {
    throw new AppError('Este correo ya esta registrado', 409);
  }

  const existingUsername = await authRepository.findByUsername(username);
  if (existingUsername) {
    throw new AppError('Este nombre de usuario ya esta en uso', 409);
  }

  const user = await authRepository.createUser({ username, email, password });
  const auth = await buildAuthPayload(user);

  return {
    message: 'Cuenta creada exitosamente',
    token: auth.accessToken,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Correo y contrasena son obligatorios', 400);
  }

  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const auth = await buildAuthPayload(user);

  return {
    message: `Bienvenido de vuelta, ${user.username}!`,
    token: auth.accessToken,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

const me = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No autenticado', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new AppError('Token invalido o expirado', 401);
  }

  const user = await authRepository.findByIdSafe(decoded.id);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return { user };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token requerido', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Refresh token invalido o expirado', 401);
  }

  const user = await authRepository.findByIdWithRefresh(decoded.id);
  if (!user || !user.refreshTokenHash) {
    throw new AppError('Sesion invalida', 401);
  }

  const isValidStoredToken = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isValidStoredToken) {
    throw new AppError('Sesion invalida', 401);
  }

  const auth = await buildAuthPayload(user);

  return {
    message: 'Token renovado',
    token: auth.accessToken,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return { message: 'Sesion cerrada' };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    await authRepository.clearRefreshTokenHash(decoded.id);
  } catch (err) {
    return { message: 'Sesion cerrada' };
  }

  return { message: 'Sesion cerrada' };
};

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
};
