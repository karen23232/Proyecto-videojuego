const User = require('../users/user.model');

const authRepository = {
  findByEmail: (email) => User.findOne({ email: email.toLowerCase() }),
  findByUsername: (username) => User.findOne({ username }),
  createUser: ({ username, email, password }) => User.create({ username, email, password }),
  findByIdSafe: (id) => User.findById(id).select('-password'),
  findByIdWithRefresh: (id) => User.findById(id).select('+refreshTokenHash'),
  updateRefreshTokenHash: (id, refreshTokenHash) =>
    User.findByIdAndUpdate(id, { refreshTokenHash }, { returnDocument: 'after' }).select('-password'),
  clearRefreshTokenHash: (id) =>
    User.findByIdAndUpdate(id, { refreshTokenHash: null }, { returnDocument: 'after' }),
};

module.exports = authRepository;
