
//
// HOTEL ANDINO - MIDDLEWARE DE ADMINISTRACIÓN
//
// Permite acceder a una ruta únicamente cuando
// el usuario autenticado tiene el rol "admin".
//

function verificarAdmin(req, res, next) {
  // El middleware auth.js debe ejecutarse primero.
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para continuar.'
    });
  }

  // Comprobar los permisos del usuario.
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      mensaje: 'No tienes permisos de administrador.'
    });
  }

  // Autorizar la continuación de la solicitud.
  next();
}

module.exports = verificarAdmin;
