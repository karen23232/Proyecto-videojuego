const AppError = require('./AppError');
const logger = require('../../config/logger');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  logger.error('Unhandled error:', err.message);

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
}

module.exports = errorHandler;
