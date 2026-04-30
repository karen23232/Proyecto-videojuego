const env = require('./config/env');
const connectDb = require('./config/db');
const logger = require('./config/logger');
const app = require('./app');

connectDb()
  .then(() => {
    logger.info('MongoDB conectado');
    app.listen(env.port, () => {
      logger.info(`Servidor corriendo en http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    logger.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
