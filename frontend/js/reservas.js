
//
// HOTEL ANDINO - MÓDULO DE RESERVAS
//
// Reglas de negocio del módulo de reservas.
// Versión final V3.
//
// Incluye:
// - Validación de fechas.
// - Detección de reservas superpuestas.
// - Consulta de habitaciones disponibles.
// - Registro de nuevas reservas.
// - Cancelación de reservas.
//

// ============================================================
// VALIDAR FECHAS
// ============================================================

export function fechasValidas(entrada, salida) {
  // Verificar el formato AAAA-MM-DD.
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(entrada || '') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(salida || '')
  ) {
    return false;
  }

  // Convertir las fechas a objetos Date.
  const a = new Date(entrada + 'T00:00:00Z');
  const b = new Date(salida + 'T00:00:00Z');

  // Comprobar que ambas fechas existen y que
  // la salida es posterior a la entrada.
  return (
    !Number.isNaN(a.getTime()) &&
    !Number.isNaN(b.getTime()) &&
    a.toISOString().slice(0, 10) === entrada &&
    b.toISOString().slice(0, 10) === salida &&
    salida > entrada
  );
}

// ============================================================
// COMPROBAR SUPERPOSICIÓN DE FECHAS
// ============================================================

export function seSuperponen(
  entradaA,
  salidaA,
  entradaB,
  salidaB
) {
  return (
    entradaA < salidaB &&
    salidaA > entradaB
  );
}

// ============================================================
// CONSULTAR HABITACIONES DISPONIBLES
// ============================================================

export function habitacionesDisponibles(
  habitaciones,
  reservas,
  entrada,
  salida
) {
  // Verificar el rango de fechas solicitado.
  if (!fechasValidas(entrada, salida)) {
    throw new Error(
      'La salida debe ser posterior a la entrada y ambas fechas deben existir.'
    );
  }

  // Retornar únicamente las habitaciones activas
  // que no tengan reservas confirmadas superpuestas.
  return habitaciones.filter(h =>
    h.activa &&
    !reservas.some(r =>
      r.habitacionId === h.id &&
      r.estado === 'CONFIRMADA' &&
      seSuperponen(
        r.fechaEntrada,
        r.fechaSalida,
        entrada,
        salida
      )
    )
  );
}

// ============================================================
// REGISTRAR UNA NUEVA RESERVA
// ============================================================

export function crearReserva(
  reservas,
  habitaciones,
  clientes,
  datos
) {
  // Validar las fechas de la reserva.
  if (!fechasValidas(datos.fechaEntrada, datos.fechaSalida)) {
    throw new Error('Rango de fechas incorrecto.');
  }

  // Buscar la habitación seleccionada.
  const habitacion = habitaciones.find(
    h => h.id === Number(datos.habitacionId)
  );

  // Buscar al cliente seleccionado.
  const cliente = clientes.find(
    c => c.id === Number(datos.clienteId)
  );

  // Comprobar que el cliente y la habitación existen,
  // y que la habitación se encuentra habilitada.
  if (!cliente || !habitacion || !habitacion.activa) {
    throw new Error(
      'Seleccione un cliente y una habitación habilitada.'
    );
  }

  // Evitar reservas superpuestas.
  const disponible = habitacionesDisponibles(
    habitaciones,
    reservas,
    datos.fechaEntrada,
    datos.fechaSalida
  ).some(h => h.id === habitacion.id);

  if (!disponible) {
    throw new Error(
      'La habitación ya está reservada para esas fechas.'
    );
  }

  // Generar el identificador de la nueva reserva.
  const id = Math.max(
    0,
    ...reservas.map(r => r.id)
  ) + 1;

  // Construir la nueva reserva.
  const reserva = {
    id,
    clienteId: cliente.id,
    habitacionId: habitacion.id,
    cliente: cliente.nombres + ' ' + cliente.apellidos,
    habitacion: habitacion.numero,
    fechaEntrada: datos.fechaEntrada,
    fechaSalida: datos.fechaSalida,
    correoUsuario: datos.correoUsuario || cliente.correo || '',
    estado: 'CONFIRMADA'
  };

  // Devolver la lista actualizada sin modificar la original.
  return [...reservas, reserva];
}

// ============================================================
// CANCELAR UNA RESERVA
// ============================================================

export function cancelarReserva(reservas, id) {
  // Comprobar que la reserva existe.
  if (!reservas.some(r => r.id === Number(id))) {
    throw new Error('Reserva no encontrada.');
  }

  // Cambiar su estado a CANCELADA sin eliminarla.
  return reservas.map(r =>
    r.id === Number(id)
      ? {
          ...r,
          estado: 'CANCELADA'
        }
      : {
          ...r
        }
  );
}
