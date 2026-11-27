
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function normalizarCorreo(correo) {
  return String(correo || '').trim().toLowerCase();
}

function crearToken(usuario) {
  return jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '2h' }
  );
}

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  };
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, correo, password } = req.body || {};

  const nombreLimpio = typeof nombre === 'string'
    ? nombre.trim()
    : '';

  const correoLimpio = normalizarCorreo(correo);

  if (
    !nombreLimpio ||
    nombreLimpio.length > 100 ||
    correoLimpio.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      mensaje: 'Ingresa un nombre y correo válidos. La contraseña debe tener entre 8 y 72 caracteres.'
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [resultado] = await pool.execute(
      `INSERT INTO usuarios
         (nombre, correo, password_hash, rol)
       VALUES (?, ?, ?, 'cliente')`,
      [nombreLimpio, correoLimpio, passwordHash]
    );

    const usuario = {
      id: resultado.insertId,
      nombre: nombreLimpio,
      correo: correoLimpio,
      rol: 'cliente'
    };

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario,
      token: crearToken(usuario)
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        mensaje: 'Ya existe una cuenta con ese correo.'
      });
    }

    console.error('Error al registrar usuario:', error.message);

    return res.status(500).json({
      mensaje: 'No se pudo registrar el usuario.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body || {};
  const correoLimpio = normalizarCorreo(correo);

  if (
    !correoLimpio ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      mensaje: 'Ingresa tu correo y contraseña.'
    });
  }

  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, correo, password_hash, rol
       FROM usuarios
       WHERE correo = ?`,
      [correoLimpio]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    const usuario = usuarios[0];

    const coincide = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!coincide) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    return res.json({
      mensaje: 'Inicio de sesión exitoso.',
      usuario: usuarioPublico(usuario),
      token: crearToken(usuario)
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    return res.status(500).json({
      mensaje: 'No se pudo iniciar sesión.'
    });
  }
});

// GET /api/auth/perfil
router.get('/perfil', async (req, res) => {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión.'
    });
  }

  try {
    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    const [usuarios] = await pool.execute(
      `SELECT id, nombre, correo, rol
       FROM usuarios
       WHERE id = ?`,
      [datos.id]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'La cuenta ya no existe.'
      });
    }

    return res.json({
      usuario: usuarioPublico(usuarios[0])
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        mensaje: 'Token inválido o vencido.'
      });
    }

    console.error('Error al consultar perfil:', error.message);

    return res.status(500).json({
      mensaje: 'No se pudo consultar el perfil.'
    });
  }
});

module.exports = router;
