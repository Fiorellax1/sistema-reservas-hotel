
const express = require('express');
const pool = require('../db');

const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin');

const router = express.Router();

// ============================================================
// PROTEGER TODAS LAS RUTAS DE ADMINISTRACIÓN
// ============================================================

router.use(verificarToken);
router.use(verificarAdmin);

// ============================================================
// GET /api/admin/usuarios
// Consultar usuarios registrados.
// Solo administradores.
// ============================================================

router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT
         id,
         nombre,
         correo,
         rol,
         fecha_registro
       FROM usuarios
       ORDER BY id DESC`
    );

    return res.json(usuarios);

  } catch (error) {
    console.error(
      'Error al consultar usuarios:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudieron consultar los usuarios.'
    });
  }
});

// ============================================================
// POST /api/admin/habitaciones
// Registrar una habitación nueva.
// Solo administradores.
// ============================================================

router.post('/habitaciones', async (req, res) => {
  const {
    numero,
    tipo,
    capacidad,
    precio,
    descripcion
  } = req.body || {};

  const numeroLimpio = String(numero || '').trim();
  const tipoLimpio = String(tipo || '').trim();
  const descripcionLimpia = descripcion == null
    ? null
    : String(descripcion).trim();

  const capacidadNumero = Number(capacidad);
  const precioNumero = Number(precio);

  // Validar los datos recibidos.
  if (
    !numeroLimpio ||
    numeroLimpio.length > 10 ||
    !tipoLimpio ||
    tipoLimpio.length > 50 ||
    !Number.isInteger(capacidadNumero) ||
    capacidadNumero <= 0 ||
    !Number.isFinite(precioNumero) ||
    precioNumero < 0
  ) {
    return res.status(400).json({
      mensaje: 'Los datos de la habitación no son válidos.'
    });
  }

  try {
    // Verificar que el número no esté registrado.
    const [existentes] = await pool.execute(
      'SELECT id FROM habitaciones WHERE numero = ?',
      [numeroLimpio]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        mensaje: 'Ya existe una habitación con ese número.'
      });
    }

    // Registrar la habitación en MySQL.
    const [resultado] = await pool.execute(
      `INSERT INTO habitaciones
         (numero, tipo, capacidad, precio, estado, descripcion)
       VALUES (?, ?, ?, ?, 'disponible', ?)`,
      [
        numeroLimpio,
        tipoLimpio,
        capacidadNumero,
        precioNumero,
        descripcionLimpia
      ]
    );

    return res.status(201).json({
      mensaje: 'Habitación registrada correctamente.',
      habitacion: {
        id: resultado.insertId,
        numero: numeroLimpio,
        tipo: tipoLimpio,
        capacidad: capacidadNumero,
        precio: precioNumero,
        estado: 'disponible',
        descripcion: descripcionLimpia
      }
    });

  } catch (error) {
    // MySQL también impide números duplicados.
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        mensaje: 'Ya existe una habitación con ese número.'
      });
    }

    console.error(
      'Error al registrar habitación:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo registrar la habitación.'
    });
  }
});

module.exports = router;
