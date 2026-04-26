const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper: generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    console.log('📥 REGISTER body recibido:', req.body);

    const { username, email, password, confirmPassword } = req.body;

    // Validate fields
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check if email or username already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Este nombre de usuario ya está en uso' });
    }

    // Create user (never pass confirmPassword to the model)
    const user = await User.create({ username, email, password });

    console.log('✅ Usuario creado:', user.username);

    const token = generateToken(user._id);

    res.status(201).json({
      message: '¡Cuenta creada exitosamente!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ ERROR EN REGISTER:', err.message);
    console.error('   Código:', err.code);
    console.error('   Stack:', err.stack);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const msg = field === 'email' ? 'Este correo ya está registrado' : 'Este usuario ya está en uso';
      return res.status(409).json({ message: msg });
    }
    res.status(500).json({ message: 'Error interno del servidor: ' + err.message });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    console.log('📥 LOGIN body recibido:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    console.log('✅ Login exitoso:', user.username);

    const token = generateToken(user._id);

    res.json({
      message: `¡Bienvenido de vuelta, ${user.username}!`,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ ERROR EN LOGIN:', err.message);
    res.status(500).json({ message: 'Error interno del servidor: ' + err.message });
  }
});

// ─── VERIFY TOKEN ────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

module.exports = router;