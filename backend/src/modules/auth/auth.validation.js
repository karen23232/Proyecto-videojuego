const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().trim().min(3).max(20),
  email: z.string().trim().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
};
