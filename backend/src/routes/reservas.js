
const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de reservas requieren autenticación.
router.use(verificarToken);

// ============================================================
// FUNCIÓN: VALIDAR FECHAS
// Comprueba el formato AAAA-MM-DD y la existencia de la fecha.
// ============================================================

function fechaValida(fecha) {
  if (
    typeof fecha !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);

  const valor = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    valor.getUTCFullYear() === anio &&
    valor.getUTCMonth() === mes - 1 &&
    valor.getUTCDate() === dia
  );
}

// ============================================================
// GET /api/reservas
// Consultar las reservas del usuario autenticado.
// Los administradores pueden consultar todas las reservas.
// ============================================================

router.get('/', async (req, res) => {
  try {
    const esAdmin = req.usuario.rol === 'admin';

    const sql = `
      SELECT
        r.id,
        r.usuario_id,
        u.nombre AS cliente,
        h.numero AS habitacion,
        h.tipo,
        r.fecha_entrada,
        r.fecha_salida,
        r.estado,
        r.fecha_creacion
      FROM reservas r
      INNER JOIN usuarios u
        ON r.usuario_id = u.id
      INNER JOIN habitaciones h
        ON r.habitacion_id = h.id
      ${esAdmin ? '' : 'WHERE r.usuario_id = ?'}
      ORDER BY r.fecha_creacion DESC, r.id DESC
    `;

    const [reservas] = await pool.query(
      sql,
      esAdmin ? [] : [req.usuario.id]
    );

    return res.json(reservas);

  } catch (error) {
    console.error(
      'Error al consultar reservas:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudieron consultar las reservas.'
    });
  }
});

// ============================================================
// POST /api/reservas
// Crear una reserva para el usuario autenticado.
// Impide reservas superpuestas para la misma habitación.
// ============================================================

router.post('/', async (req, res) => {
  const {
    habitacion_id,
    fecha_entrada,
    fecha_salida
  } = req.body || {};

  // El ID del usuario se obtiene del token, no del formulario.
  const usuario_id = req.usuario.id;

  // Validar el identificador de la habitación.
  if (
    !Number.isInteger(habitacion_id) ||
    habitacion_id <= 0
  ) {
    return res.status(400).json({
      mensaje: 'El ID de la habitación no es válido.'
    });
  }

  // Validar fechas de entrada y salida.
  if (
    !fechaValida(fecha_entrada) ||
    !fechaValida(fecha_salida) ||
    fecha_salida <= fecha_entrada
  ) {
    return res.status(400).json({
      mensaje: 'Las fechas de la reserva no son válidas.'
    });
  }

  let conexion;

  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    // Bloquear la habitación durante la transacción.
    // Evita que dos solicitudes simultáneas la reserven
    // para fechas superpuestas usando esta misma operación.
    const [habitaciones] = await conexion.query(
      `SELECT id, estado
       FROM habitaciones
       WHERE id = ?
       FOR UPDATE`,
      [habitacion_id]
    );

    // Comprobar que la habitación existe.
    if (habitaciones.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        mensaje: 'La habitación no existe.'
      });
    }

    // Comprobar que la habitación está habilitada.
    if (habitaciones[0].estado !== 'disponible') {
      await conexion.rollback();

      return res.status(409).json({
        mensaje: 'La habitación no está habilitada para reservas.'
      });
    }

    // Comprobar que la cuenta sigue existiendo.
    const [usuarios] = await conexion.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [usuario_id]
    );

    if (usuarios.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        mensaje: 'El usuario no existe.'
      });
    }

    // Buscar reservas confirmadas que se superpongan.
    const [conflictos] = await conexion.query(
      `SELECT id
       FROM reservas
       WHERE habitacion_id = ?
         AND estado = 'confirmada'
         AND fecha_entrada < ?
         AND fecha_salida > ?
       LIMIT 1`,
      [habitacion_id, fecha_salida, fecha_entrada]
    );

    if (conflictos.length > 0) {
      await conexion.rollback();

      return res.status(409).json({
        mensaje: 'La habitación ya está reservada en esas fechas.'
      });
    }

    // Registrar la nueva reserva en MySQL.
    const [resultado] = await conexion.query(
      `INSERT INTO reservas (
         usuario_id,
         habitacion_id,
         fecha_entrada,
         fecha_salida
       )
       VALUES (?, ?, ?, ?)`,
      [
        usuario_id,
        habitacion_id,
        fecha_entrada,
        fecha_salida
      ]
    );

    await conexion.commit();

    return res.status(201).json({
      mensaje: 'Reserva registrada correctamente.',
      reserva: {
        id: resultado.insertId,
        usuario_id,
        habitacion_id,
        fecha_entrada,
        fecha_salida,
        estado: 'confirmada'
      }
    });

  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch (rollbackError) {
        console.error(
          'Error al revertir la transacción:',
          rollbackError.message
        );
      }
    }

    console.error(
      'Error al registrar reserva:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo registrar la reserva.'
    });

  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// ============================================================
// PATCH /api/reservas/:id/cancelar
// Cancelar una reserva sin eliminar su historial.
// Solo puede hacerlo su propietario o un administrador.
// ============================================================

router.patch('/:id/cancelar', async (req, res) => {
  const id = Number(req.params.id);

  // Validar el ID de la reserva.
  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return res.status(400).json({
      mensaje: 'El ID de la reserva no es válido.'
    });
  }

  let conexion;

  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    // Buscar y bloquear la reserva.
    const [reservas] = await conexion.query(
      `SELECT id, usuario_id, estado
       FROM reservas
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    // 1. Comprobar que la reserva existe.
    if (reservas.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        mensaje: 'La reserva no existe.'
      });
    }

    // 2. Comprobar los permisos del usuario.
    const esPropietario =
      reservas[0].usuario_id === req.usuario.id;

    const esAdmin =
      req.usuario.rol === 'admin';

    if (!esPropietario && !esAdmin) {
      await conexion.rollback();

      return res.status(403).json({
        mensaje: 'No tienes permiso para cancelar esta reserva.'
      });
    }

    // 3. Comprobar si la reserva ya está cancelada.
    if (reservas[0].estado === 'cancelada') {
      await conexion.rollback();

      return res.status(409).json({
        mensaje: 'La reserva ya se encuentra cancelada.'
      });
    }

    // 4. Actualizar el estado sin eliminar el registro.
    await conexion.query(
      `UPDATE reservas
       SET estado = 'cancelada'
       WHERE id = ?`,
      [id]
    );

    await conexion.commit();

    return res.json({
      mensaje: 'Reserva cancelada correctamente.',
      reserva: {
        id,
        estado: 'cancelada'
      }
    });

  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch (rollbackError) {
        console.error(
          'Error al revertir la transacción:',
          rollbackError.message
        );
      }
    }

    console.error(
      'Error al cancelar reserva:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo cancelar la reserva.'
    });

  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

module.exports = router;
