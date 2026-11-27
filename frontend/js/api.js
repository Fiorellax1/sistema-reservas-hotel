
//
// HOTEL ANDINO - CONEXIÓN CON EL BACKEND
// Configuración local para desarrollo.
//

const API_BASE =
  window.location.port === '5500' ||
  window.location.port === '5501'
    ? 'http://localhost:3000'
    : '';


const CLAVE_TOKEN = 'andino-token-api-v1';

export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
}

export function eliminarToken() {
  sessionStorage.removeItem(CLAVE_TOKEN);
}

export async function solicitarApi(ruta, opciones = {}) {
  const {
    method = 'GET',
    body,
    autenticado = true
  } = opciones;

  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (autenticado) {
    const token = obtenerToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      method,
      headers,
      body: body === undefined
        ? undefined
        : JSON.stringify(body)
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el backend. Comprueba que Express esté encendido.'
    );
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || 'Ocurrió un error al consultar el servidor.'
    );
  }

  return datos;
}
