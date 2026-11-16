// Datos del navegador para la versión que publica GitHub Pages.
// Las cuentas y reservas no se comparten entre dispositivos.
import {crearReserva, cancelarReserva, habitacionesDisponibles} from './reservas.js';
const CLAVE = 'hotel-andino-datos-v2';
const inicial = {
  habitaciones: [
    {id:1, numero:'101', tipo:'Simple', capacidad:1, precio:120, activa:true},
    {id:2, numero:'102', tipo:'Doble', capacidad:2, precio:190, activa:true},
    {id:3, numero:'201', tipo:'Matrimonial', capacidad:2, precio:240, activa:true},
    {id:4, numero:'202', tipo:'Familiar', capacidad:4, precio:340, activa:true},
    {id:5, numero:'301', tipo:'Doble', capacidad:2, precio:210, activa:true},
    {id:6, numero:'302', tipo:'Familiar', capacidad:5, precio:390, activa:true}
  ],
  clientes: [], reservas: []
};
function cargar() {try {return JSON.parse(localStorage.getItem(CLAVE)) || structuredClone(inicial);} catch {return structuredClone(inicial);}}
function guardar(datos) {localStorage.setItem(CLAVE, JSON.stringify(datos));}
function nuevoId(lista) {return Math.max(0, ...lista.map(item=>item.id)) + 1;}
export async function demoApi(ruta, opciones={}) {
  const datos=cargar(); const metodo=opciones.method || 'GET'; const cuerpo=opciones.body ? JSON.parse(opciones.body) : {};
  if (ruta === '/api/habitaciones') {
    if (metodo === 'GET') return datos.habitaciones;
    if (!String(cuerpo.numero || '').trim() || !(cuerpo.capacidad>0) || !(cuerpo.precio>0)) throw new Error('Completa los datos de la habitación.');
    if (datos.habitaciones.some(h=>h.numero===cuerpo.numero)) throw new Error('Ese número de habitación ya está registrado.');
    const habitacion={...cuerpo,id:nuevoId(datos.habitaciones),activa:true};datos.habitaciones.push(habitacion);guardar(datos);return habitacion;
  }
  if (ruta === '/api/clientes') {
    if (metodo === 'GET') return datos.clientes;
    if (!cuerpo.nombres?.trim() || !cuerpo.apellidos?.trim() || !String(cuerpo.dni || '').trim()) throw new Error('Completa los datos del huésped.');
    if (datos.clientes.some(c=>c.dni===cuerpo.dni)) throw new Error('Ese documento ya está registrado.');
    const cliente={...cuerpo,id:nuevoId(datos.clientes)};datos.clientes.push(cliente);guardar(datos);return cliente;
  }
  if (ruta === '/api/reservas') {
    if (metodo === 'GET') return datos.reservas;
    const nuevas=crearReserva(datos.reservas,datos.habitaciones,datos.clientes,cuerpo);
    datos.reservas=nuevas;guardar(datos);return nuevas.at(-1);
  }
  const cancelacion=ruta.match(/^\/api\/reservas\/(\d+)\/cancelar$/);
  if (cancelacion && metodo === 'PATCH') {datos.reservas=cancelarReserva(datos.reservas,Number(cancelacion[1]));guardar(datos);return datos.reservas.find(r=>r.id===Number(cancelacion[1]));}
  if (ruta.startsWith('/api/disponibilidad?')) {const q=new URLSearchParams(ruta.split('?')[1]);return habitacionesDisponibles(datos.habitaciones,datos.reservas,q.get('entrada'),q.get('salida'));}
  throw new Error('Operación no disponible.');
}
