const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/habitaciones
// Consultar todas las habitaciones del hotel
router.get('/', async (req, res) => {
  try {
    const [habitaciones] = await pool.query(`
      SELECT
        id,
        numero,
        tipo,
        capacidad,
        precio,
        estado,
        descripcion
      FROM habitaciones
      ORDER BY numero ASC
    `);

    res.json(habitaciones);

  } catch (error) {
    console.error(
      'Error al consultar habitaciones:',
      error.message
    );

    res.status(500).json({
      mensaje: 'No se pudieron consultar las habitaciones'
    });
  }
});



function fechaValida(fecha) {
  if (typeof fecha !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const valor = new Date(Date.UTC(anio, mes - 1, dia));

  return valor.getUTCFullYear() === anio &&
    valor.getUTCMonth() === mes - 1 &&
    valor.getUTCDate() === dia;
}

// GET /api/habitaciones/disponibilidad
router.get('/disponibilidad', async (req, res) => {
  const { entrada, salida } = req.query;

  if (!fechaValida(entrada) ||
      !fechaValida(salida) ||
      salida <= entrada) {
    return res.status(400).json({
      mensaje: 'Ingresa fechas válidas. La salida debe ser posterior a la entrada.'
    });
  }

  try {
    const [habitaciones] = await pool.query(`
      SELECT
        h.id,
        h.numero,
        h.tipo,
        h.capacidad,
        h.precio,
        h.estado,
        h.descripcion
      FROM habitaciones h
      WHERE h.estado = 'disponible'
        AND NOT EXISTS (
          SELECT 1
          FROM reservas r
          WHERE r.habitacion_id = h.id
            AND r.estado = 'confirmada'
            AND r.fecha_entrada < ?
            AND r.fecha_salida > ?
        )
      ORDER BY h.numero ASC
    `, [salida, entrada]);

    res.json(habitaciones);

  } catch (error) {
    console.error(
      'Error al consultar disponibilidad:',
      error.message
    );

    res.status(500).json({
      mensaje: 'No se pudo consultar la disponibilidad'
    });
  }
});


module.exports = router;
