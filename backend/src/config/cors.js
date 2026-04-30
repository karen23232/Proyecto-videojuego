const env = require('./env');

const defaultAllowedOrigins = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const envOrigins = env.frontendOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = env.frontendOrigin === '*'
  ? '*'
  : [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const corsConfig = {
  origin: (origin, callback) => {
    if (env.nodeEnv !== 'production') {
      callback(null, true);
      return;
    }

    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = corsConfig;
