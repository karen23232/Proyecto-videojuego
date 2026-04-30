const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validate = require('../../common/middlewares/validate');
const authController = require('./auth.controller');
const { registerSchema, loginSchema } = require('./auth.validation');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.me));

module.exports = router;
