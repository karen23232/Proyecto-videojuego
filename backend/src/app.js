const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');

const corsConfig = require('./config/cors');
const rateLimiter = require('./common/middlewares/rateLimiter');
const notFound = require('./common/middlewares/notFound');
const errorHandler = require('./common/errors/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const commentRoutes = require('./modules/comments/comment.routes');
const healthRoutes = require('./modules/health/health.routes');

const app = express();

app.disable('x-powered-by');
if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors(corsConfig));
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Recessed Minds API running' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
