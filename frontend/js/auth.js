
//
// HOTEL ANDINO - AUTENTICACIÓN CON BACKEND
// Los usuarios se registran y autentican en MySQL.
//

import {
  solicitarApi,
  guardarToken,
  obtenerToken,
  eliminarToken
} from './api.js';

const CLAVE_SESION = 'andino-sesion-api-v1';

function normalizarCorreo(correo) {
  return String(correo || '').trim().toLowerCase();
}

function guardarSesion(usuario) {
  sessionStorage.setItem(
    CLAVE_SESION,
    JSON.stringify(usuario)
  );
}

function adaptarUsuario(usuario, datosRegistro = null) {
  const nombreCompleto = String(
    usuario.nombre || ''
  ).trim();

  const partes = nombreCompleto.split(/\s+/);

  return {
    id: usuario.id,
    nombres: datosRegistro?.nombres?.trim()
      || partes[0]
      || '',
    apellidos: datosRegistro?.apellidos?.trim()
      || partes.slice(1).join(' '),
    correo: usuario.correo,
    telefono: datosRegistro?.telefono?.trim() || '',
    rol: usuario.rol === 'admin'
      ? 'PERSONAL'
      : 'CLIENTE'
  };
}

// ============================================================
// REGISTRO DE USUARIOS
// POST /api/auth/registro
// ============================================================

export async function registrarUsuario(datos) {
  const nombres = String(datos.nombres || '').trim();
  const apellidos = String(datos.apellidos || '').trim();
  const telefono = String(datos.telefono || '').trim();
  const correo = normalizarCorreo(datos.correo);

  if (
    !nombres ||
    !apellidos ||
    !telefono ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    throw new Error(
      'Completa tus datos personales correctamente.'
    );
  }

  if (nombres.length + apellidos.length + 1 > 100) {
    throw new Error(
      'Los nombres y apellidos son demasiado largos.'
    );
  }

  if (
    typeof datos.password !== 'string' ||
    datos.password.length < 8 ||
    datos.password.length > 72
  ) {
    throw new Error(
      'La contraseña debe tener entre 8 y 72 caracteres.'
    );
  }

  if (datos.password !== datos.confirmacion) {
    throw new Error(
      'Las contraseñas no coinciden.'
    );
  }

  // El registro público solo permite crear clientes.
  if (datos.codigoPersonal?.trim()) {
    throw new Error(
      'El registro de personal requiere autorización del administrador.'
    );
  }

  const respuesta = await solicitarApi(
    '/api/auth/registro',
    {
      method: 'POST',
      autenticado: false,
      body: {
        nombre: `${nombres} ${apellidos}`,
        correo,
        password: datos.password
      }
    }
  );

  const sesion = adaptarUsuario(
    respuesta.usuario,
    { nombres, apellidos, telefono }
  );

  guardarToken(respuesta.token);
  guardarSesion(sesion);

  return sesion;
}

// ============================================================
// INICIO DE SESIÓN
// POST /api/auth/login
// ============================================================

export async function iniciarSesion(correo, password) {
  const respuesta = await solicitarApi(
    '/api/auth/login',
    {
      method: 'POST',
      autenticado: false,
      body: {
        correo: normalizarCorreo(correo),
        password
      }
    }
  );

  const sesion = adaptarUsuario(respuesta.usuario);

  guardarToken(respuesta.token);
  guardarSesion(sesion);

  return sesion;
}

// ============================================================
// CONSULTAR SESIÓN LOCAL
// ============================================================

export function sesionActual() {
  if (!obtenerToken()) {
    return null;
  }

  try {
    const datos = sessionStorage.getItem(CLAVE_SESION);
    return datos ? JSON.parse(datos) : null;
  } catch {
    return null;
  }
}

// ============================================================
// CERRAR SESIÓN
// ============================================================

export function cerrarSesion() {
  eliminarToken();
  sessionStorage.removeItem(CLAVE_SESION);
}



// ============================================================
// VERIFICAR LA SESIÓN CONTRA EL BACKEND
// ============================================================

export async function verificarSesionActual() {
  // Comprobar si existe una sesión guardada.
  const sesion = sesionActual();

  if (!sesion) {
    return null;
  }

  try {
    // Comprobar que el token siga siendo válido.
    const respuesta = await solicitarApi('/api/auth/perfil');

    // Actualizar los datos con la información real de MySQL.
    const usuarioVerificado = adaptarUsuario(respuesta.usuario);

    guardarSesion(usuarioVerificado);

    return usuarioVerificado;

  } catch {
    // Si el backend rechaza el token o no está disponible,
    // cerrar la sesión local por precaución.
    cerrarSesion();

    return null;
  }
}
