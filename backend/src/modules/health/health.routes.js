const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;

  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'API saludable' : 'API sin conexion a DB',
    db: {
      connected: dbConnected,
      state: dbState,
    },
  });
});

module.exports = router;
