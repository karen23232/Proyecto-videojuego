const dotenv = require('dotenv');

dotenv.config();

const requiredVars = [
  'MONGODB_URI',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

if (!process.env.JWT_ACCESS_SECRET && !process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_ACCESS_SECRET (or JWT_SECRET fallback)');
}

if (!process.env.JWT_REFRESH_SECRET && !process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_REFRESH_SECRET (or JWT_SECRET fallback)');
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 200,
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

module.exports = env;
