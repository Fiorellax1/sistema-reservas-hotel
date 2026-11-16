// Reglas de negocio del módulo de reservas (versión final V3).
export function fechasValidas(entrada, salida) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada || '') || !/^\d{4}-\d{2}-\d{2}$/.test(salida || '')) return false;
  const a = new Date(entrada + 'T00:00:00Z');
  const b = new Date(salida + 'T00:00:00Z');
  return !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) &&
    a.toISOString().slice(0, 10) === entrada && b.toISOString().slice(0, 10) === salida && salida > entrada;
}
export function seSuperponen(entradaA, salidaA, entradaB, salidaB) {
  return entradaA < salidaB && salidaA > entradaB;
}
export function habitacionesDisponibles(habitaciones, reservas, entrada, salida) {
  if (!fechasValidas(entrada, salida)) throw new Error('La salida debe ser posterior a la entrada y ambas fechas deben existir.');
  return habitaciones.filter(h => h.activa && !reservas.some(r =>
    r.habitacionId === h.id && r.estado === 'CONFIRMADA' &&
    seSuperponen(r.fechaEntrada, r.fechaSalida, entrada, salida)));
}
export function crearReserva(reservas, habitaciones, clientes, datos) {
  if (!fechasValidas(datos.fechaEntrada, datos.fechaSalida)) throw new Error('Rango de fechas incorrecto.');
  const habitacion = habitaciones.find(h => h.id === Number(datos.habitacionId));
  const cliente = clientes.find(c => c.id === Number(datos.clienteId));
  if (!cliente || !habitacion || !habitacion.activa) throw new Error('Seleccione un cliente y una habitación habilitada.');
  if (!habitacionesDisponibles(habitaciones, reservas, datos.fechaEntrada, datos.fechaSalida).some(h => h.id === habitacion.id)) {
    throw new Error('La habitación ya está reservada para esas fechas.');
  }
  const id = Math.max(0, ...reservas.map(r => r.id)) + 1;
  const reserva = {id, clienteId: cliente.id, habitacionId: habitacion.id,
    cliente: cliente.nombres + ' ' + cliente.apellidos, habitacion: habitacion.numero,
    fechaEntrada: datos.fechaEntrada, fechaSalida: datos.fechaSalida, correoUsuario: datos.correoUsuario || cliente.correo || '', estado: 'CONFIRMADA'};
  return [...reservas, reserva];
}
export function cancelarReserva(reservas, id) {
  if (!reservas.some(r => r.id === Number(id))) throw new Error('Reserva no encontrada.');
  return reservas.map(r => r.id === Number(id) ? {...r, estado: 'CANCELADA'} : {...r});
}
