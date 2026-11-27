
//
// HOTEL ANDINO - DATOS LOCALES DEL FRONTEND
//
// Datos del navegador para la versión estática publicada
// en GitHub Pages.
//
// Las cuentas y reservas almacenadas localmente no se
// comparten entre diferentes dispositivos.
//

import {
  crearReserva,
  cancelarReserva,
  habitacionesDisponibles
} from './reservas.js';

// ============================================================
// CONFIGURACIÓN DEL ALMACENAMIENTO LOCAL
// ============================================================

const CLAVE = 'hotel-andino-datos-v2';

// ============================================================
// DATOS INICIALES DEL SISTEMA
// ============================================================

const inicial = {
  habitaciones: [
    {
      id: 1,
      numero: '101',
      tipo: 'Simple',
      capacidad: 1,
      precio: 120,
      activa: true
    },
    {
      id: 2,
      numero: '102',
      tipo: 'Doble',
      capacidad: 2,
      precio: 190,
      activa: true
    },
    {
      id: 3,
      numero: '201',
      tipo: 'Matrimonial',
      capacidad: 2,
      precio: 240,
      activa: true
    },
    {
      id: 4,
      numero: '202',
      tipo: 'Familiar',
      capacidad: 4,
      precio: 340,
      activa: true
    },
    {
      id: 5,
      numero: '301',
      tipo: 'Doble',
      capacidad: 2,
      precio: 210,
      activa: true
    },
    {
      id: 6,
      numero: '302',
      tipo: 'Familiar',
      capacidad: 5,
      precio: 390,
      activa: true
    }
  ],
  clientes: [],
  reservas: []
};

// ============================================================
// FUNCIONES PARA GESTIONAR LOCALSTORAGE
// ============================================================

// Recuperar los datos guardados en el navegador.
function cargar() {
  try {
    return (
      JSON.parse(localStorage.getItem(CLAVE)) ||
      structuredClone(inicial)
    );
  } catch {
    return structuredClone(inicial);
  }
}

// Guardar los datos actualizados en el navegador.
function guardar(datos) {
  localStorage.setItem(CLAVE, JSON.stringify(datos));
}

// Generar un nuevo identificador para un registro.
function nuevoId(lista) {
  return Math.max(
    0,
    ...lista.map(item => item.id)
  ) + 1;
}

// ============================================================
// API SIMULADA DEL FRONTEND
// ============================================================

export async function demoApi(ruta, opciones = {}) {
  const datos = cargar();
  const metodo = opciones.method || 'GET';

  const cuerpo = opciones.body
    ? JSON.parse(opciones.body)
    : {};

  // ----------------------------------------------------------
  // HABITACIONES
  // ----------------------------------------------------------

  if (ruta === '/api/habitaciones') {
    // Consultar habitaciones.
    if (metodo === 'GET') {
      return datos.habitaciones;
    }

    // Validar los datos de una nueva habitación.
    if (
      !String(cuerpo.numero || '').trim() ||
      !(cuerpo.capacidad > 0) ||
      !(cuerpo.precio > 0)
    ) {
      throw new Error(
        'Completa los datos de la habitación.'
      );
    }

    // Evitar habitaciones con el mismo número.
    if (
      datos.habitaciones.some(
        h => h.numero === cuerpo.numero
      )
    ) {
      throw new Error(
        'Ese número de habitación ya está registrado.'
      );
    }

    // Registrar la habitación.
    const habitacion = {
      ...cuerpo,
      id: nuevoId(datos.habitaciones),
      activa: true
    };

    datos.habitaciones.push(habitacion);

    guardar(datos);

    return habitacion;
  }

  // ----------------------------------------------------------
  // CLIENTES
  // ----------------------------------------------------------

  if (ruta === '/api/clientes') {
    // Consultar clientes.
    if (metodo === 'GET') {
      return datos.clientes;
    }

    // Validar los datos del cliente.
    if (
      !cuerpo.nombres?.trim() ||
      !cuerpo.apellidos?.trim() ||
      !String(cuerpo.dni || '').trim()
    ) {
      throw new Error(
        'Completa los datos del huésped.'
      );
    }

    // Evitar clientes con documentos duplicados.
    if (
      datos.clientes.some(
        c => c.dni === cuerpo.dni
      )
    ) {
      throw new Error(
        'Ese documento ya está registrado.'
      );
    }

    // Registrar el cliente.
    const cliente = {
      ...cuerpo,
      id: nuevoId(datos.clientes)
    };

    datos.clientes.push(cliente);

    guardar(datos);

    return cliente;
  }

  // ----------------------------------------------------------
  // RESERVAS
  // ----------------------------------------------------------

  if (ruta === '/api/reservas') {
    // Consultar reservas.
    if (metodo === 'GET') {
      return datos.reservas;
    }

    // Registrar una nueva reserva.
    const nuevas = crearReserva(
      datos.reservas,
      datos.habitaciones,
      datos.clientes,
      cuerpo
    );

    datos.reservas = nuevas;

    guardar(datos);

    return nuevas.at(-1);
  }

  // ----------------------------------------------------------
  // CANCELACIÓN DE RESERVAS
  // ----------------------------------------------------------

  const cancelacion = ruta.match(
    /^\/api\/reservas\/(\d+)\/cancelar$/
  );

  if (cancelacion && metodo === 'PATCH') {
    const idReserva = Number(cancelacion[1]);

    datos.reservas = cancelarReserva(
      datos.reservas,
      idReserva
    );

    guardar(datos);

    return datos.reservas.find(
      r => r.id === idReserva
    );
  }

  // ----------------------------------------------------------
  // CONSULTA DE DISPONIBILIDAD
  // ----------------------------------------------------------

  if (ruta.startsWith('/api/disponibilidad?')) {
    const parametros = new URLSearchParams(
      ruta.split('?')[1]
    );

    return habitacionesDisponibles(
      datos.habitaciones,
      datos.reservas,
      parametros.get('entrada'),
      parametros.get('salida')
    );
  }

  // ----------------------------------------------------------
  // OPERACIÓN NO RECONOCIDA
  // ----------------------------------------------------------

  throw new Error('Operación no disponible.');
}
