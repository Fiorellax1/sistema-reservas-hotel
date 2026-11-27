require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const habitacionesRoutes = require('./routes/habitaciones');
const reservasRoutes = require('./routes/reservas');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/habitaciones', habitacionesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Verificar que el servidor esté funcionando
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'ok',
    sistema: 'Hotel Andino',
    mensaje: 'Backend funcionando correctamente'
  });
});

// Comprobar la conexión con MySQL
app.get('/api/db-check', async (req, res) => {
  try {
    const [tablas] = await pool.query('SHOW TABLES');

    res.json({
      estado: 'ok',
      mensaje: 'Conexión con MySQL exitosa',
      base_datos: process.env.DB_NAME,
      total_tablas: tablas.length
    });
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message);

    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo conectar con MySQL'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Hotel Andino API: http://localhost:${PORT}`);
});