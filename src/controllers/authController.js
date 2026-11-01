const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'clave_secreta_ups';
  return jwt.sign({ id: user._id, email: user.email, nombre: user.nombre }, secret, {
    expiresIn: '8h'
  });
};

exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Debe ingresar nombre, email y contraseña'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El correo electrónico ya se encuentra registrado'
      });
    }

    const user = await User.create({ nombre, email, password });
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, nombre: user.nombre, email: user.email },
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Credenciales incompletas: se requiere email y password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales de acceso inválidas'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales de acceso inválidas'
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, nombre: user.nombre, email: user.email },
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, data: { message: 'Sesión finalizada exitosamente' } });
};
