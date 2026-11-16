// Gestión de cuentas para el prototipo estático.
// Un sistema público requiere autenticación y autorización en un servidor.
const CLAVE_USUARIOS = 'andino-usuarios-v2';
const CLAVE_SESION = 'andino-sesion-v2';
const CODIGO_PERSONAL = 'ANDINO2026';
function leer(clave, alternativo) {try {return JSON.parse(localStorage.getItem(clave)) ?? alternativo;} catch {return alternativo;}}
function guardar(clave, valor) {localStorage.setItem(clave, JSON.stringify(valor));}
function normalizarCorreo(correo) {return String(correo || '').trim().toLowerCase();}
function sal() {return Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, '0')).join('');}
async function calcularHash(password, salt) {
  const bytes = new TextEncoder().encode(salt + ':' + password);
  const salida = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(salida), x => x.toString(16).padStart(2, '0')).join('');
}
export async function registrarUsuario(datos) {
  const correo = normalizarCorreo(datos.correo);
  const usuarios = leer(CLAVE_USUARIOS, []);
  if (!datos.nombres?.trim() || !datos.apellidos?.trim() || !datos.telefono?.trim() || !/^\S+@\S+\.\S+$/.test(correo)) throw new Error('Completa tus datos personales correctamente.');
  if (String(datos.password || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (datos.password !== datos.confirmacion) throw new Error('Las contraseñas no coinciden.');
  if (usuarios.some(u => u.correo === correo)) throw new Error('Ya existe una cuenta con este correo.');
  if (datos.codigoPersonal && datos.codigoPersonal !== CODIGO_PERSONAL) throw new Error('El código del personal no es válido.');
  const salt = sal();
  const usuario = {id: Math.max(0, ...usuarios.map(u => u.id)) + 1, nombres: datos.nombres.trim(), apellidos: datos.apellidos.trim(), correo, telefono: datos.telefono.trim(), rol: datos.codigoPersonal ? 'PERSONAL' : 'CLIENTE', salt, passwordHash: await calcularHash(datos.password, salt)};
  usuarios.push(usuario); guardar(CLAVE_USUARIOS, usuarios);
  const sesion = {id: usuario.id, nombres: usuario.nombres, apellidos: usuario.apellidos, correo: usuario.correo, telefono: usuario.telefono, rol: usuario.rol};
  guardar(CLAVE_SESION, sesion);
  return sesion;
}
export async function iniciarSesion(correo, password) {
  const usuario = leer(CLAVE_USUARIOS, []).find(u => u.correo === normalizarCorreo(correo));
  if (!usuario || await calcularHash(password, usuario.salt) !== usuario.passwordHash) throw new Error('Correo o contraseña incorrectos.');
  const sesion = {id: usuario.id, nombres: usuario.nombres, apellidos: usuario.apellidos, correo: usuario.correo, telefono: usuario.telefono, rol: usuario.rol};
  guardar(CLAVE_SESION, sesion);
  return sesion;
}
export function sesionActual() {return leer(CLAVE_SESION, null);}
export function cerrarSesion() {localStorage.removeItem(CLAVE_SESION);}
