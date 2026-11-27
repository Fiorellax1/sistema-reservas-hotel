
const jwt = require('jsonwebtoken');
const pool = require('../db');

async function verificarToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [tipo, token] = authorization.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para continuar.'
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
        mensaje: 'El usuario ya no existe.'
      });
    }

    // Usuario autenticado, obtenido directamente de MySQL
    req.usuario = usuarios[0];

    next();

  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        mensaje: 'Sesión inválida o vencida.'
      });
    }

    console.error(
      'Error al verificar autenticación:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo verificar la sesión.'
    });
  }
}

module.exports = verificarToken;
