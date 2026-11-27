
import { fechasValidas } from './reservas.js';
import { solicitarApi } from './api.js';

import {
  registrarUsuario,
  iniciarSesion,
  sesionActual,
  cerrarSesion,
  verificarSesionActual
} from './auth.js';


const $ = selector => document.querySelector(selector);
const formData = form => Object.fromEntries(new FormData(form).entries());

let usuario = sesionActual();
let habitaciones = [];
let clientes = [];
let reservas = [];
let ultimaBusqueda = null;

// ============================================================
// FUNCIONES GENERALES
// ============================================================

function mensaje(texto, error = false) {
  const caja = $('#mensaje');

  caja.textContent = texto;
  caja.classList.toggle('error', error);
  caja.hidden = false;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function errorAcceso(texto) {
  const caja = $('#errorAcceso');

  caja.textContent = texto;
  caja.hidden = false;
}

function limpiarErrores() {
  $('#errorAcceso').hidden = true;
  $('#mensaje').hidden = true;
}

function celda(tr, valor) {
  const td = document.createElement('td');

  td.textContent = String(valor ?? '');
  tr.append(td);

  return td;
}

function crear(tag, clase, contenido) {
  const nodo = document.createElement(tag);

  if (clase) {
    nodo.className = clase;
  }

  if (contenido !== undefined) {
    nodo.textContent = contenido;
  }

  return nodo;
}

function estado(texto) {
  return crear(
    'span',
    'estado' + (texto === 'CANCELADA' ? ' cancelada' : ''),
    texto === 'CANCELADA' ? 'Cancelada' : 'Confirmada'
  );
}

function fechaLegible(fecha) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ============================================================
// ACCESO Y NAVEGACIÓN
// ============================================================

function uiAcceso(registro = false) {
  $('#formLogin').hidden = registro;
  $('#formRegistro').hidden = !registro;

  $('#tituloAcceso').textContent = registro
    ? 'Crear una cuenta'
    : 'Iniciar sesión';

  $('#descripcionAcceso').textContent = registro
    ? 'Regístrate para reservar y administrar tus estancias.'
    : 'Ingresa a tu cuenta para gestionar tus reservas.';

  limpiarErrores();
}

function navegar(pagina) {
  if (pagina === 'administracion' && usuario?.rol !== 'PERSONAL') {
    pagina = 'inicio';
  }

  document.querySelectorAll('[data-tab]').forEach(b => {
    b.classList.toggle('activa', b.dataset.tab === pagina);
  });

  document.querySelectorAll('.seccion').forEach(s => {
    s.classList.toggle('activa', s.id === pagina);
  });

  limpiarErrores();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pagina === 'misReservas') {
    renderMisReservas();
  }

  if (pagina === 'administracion') {
    renderAdmin();
  }
}

// ============================================================
// HABITACIONES
// ============================================================

function habitacionCard(h, botonTexto = 'Reservar') {
  const card = crear('article', 'habitacion-card');
  card.append(crear('div', 'habitacion-arte'));

  const info = crear('div', 'habitacion-info');

  info.append(
    crear('span', 'texto-suave', 'HABITACIÓN ' + h.numero),
    crear('h3', '', h.tipo),
    crear(
      'p',
      '',
      'Hasta ' + h.capacidad + ' huésped(es) · Confort y tranquilidad'
    )
  );

  const final = crear('div', 'habitacion-final');
  const precio = crear(
    'div',
    'precio',
    'S/ ' + Number(h.precio).toFixed(2)
  );

  precio.append(crear('small', '', ' / noche'));

  const boton = crear('button', 'boton principal', botonTexto);
  boton.type = 'button';

  boton.addEventListener('click', () => {
    navegar('reservar');

    if (ultimaBusqueda) {
      $('#formBuscar').requestSubmit();
    }
  });

  final.append(precio, boton);
  info.append(final);
  card.append(info);

  return card;
}



async function actualizar() {
  // Consultar habitaciones desde MySQL.
  const habitacionesApi = await solicitarApi('/api/habitaciones');

  habitaciones = habitacionesApi.map(h => ({
    ...h,
    activa: h.estado === 'disponible'
  }));



  // Solo el administrador consulta la lista de usuarios.
  clientes = usuario?.rol === 'PERSONAL'
    ? await solicitarApi('/api/admin/usuarios')
    : [];


  // Consultar las reservas reales del usuario autenticado.
  const reservasApi = await solicitarApi('/api/reservas');

  // Adaptar los nombres de los campos del backend
  // a los utilizados actualmente en el frontend.
  reservas = reservasApi.map(r => ({
    ...r,

    // Adaptar las fechas para mostrarlas en la página.
    fechaEntrada: String(r.fecha_entrada).slice(0, 10),
    fechaSalida: String(r.fecha_salida).slice(0, 10),

    // Identificar las reservas propias del usuario.
    // Las reservas de otros clientes no se mostrarán
    // dentro de "Mis reservas" del administrador.
    correoUsuario: r.usuario_id === usuario.id
      ? usuario.correo
      : '',

    // Convertir el estado al formato del frontend.
    estado: r.estado.toUpperCase()
  }));


  // Actualizar las pantallas.
  renderInicio();
  renderHabitaciones();
  renderMisReservas();

  if (usuario?.rol === 'PERSONAL') {
    renderAdmin();
  }
}



function renderInicio() {
  const resumen = $('#resumenInicio');
  resumen.replaceChildren();

  const propias = reservas.filter(
    r => r.correoUsuario === usuario.correo
  );

  const cifras = [
    ['Habitaciones', habitaciones.filter(h => h.activa).length],
    ['Mis reservas', propias.length],
    [
      'Reservas activas',
      propias.filter(r => r.estado === 'CONFIRMADA').length
    ]
  ];

  cifras.forEach(([titulo, valor]) => {
    const nodo = crear('div', 'dato');

    nodo.append(
      crear('strong', '', valor),
      crear('span', '', titulo)
    );

    resumen.append(nodo);
  });

  const cont = $('#destacadas');
  cont.replaceChildren();

  habitaciones
    .filter(h => h.activa)
    .slice(0, 3)
    .forEach(h => cont.append(habitacionCard(h)));
}

function renderHabitaciones() {
  const cont = $('#tarjetasHabitaciones');
  cont.replaceChildren();

  habitaciones
    .filter(h => h.activa)
    .forEach(h => cont.append(habitacionCard(h)));
}

// ============================================================
// RESERVAS
// ============================================================

function tarjetaReserva(r, mostrarCliente = false) {
  const cont = crear('article', 'reserva-card');
  const dato = crear('div');

  dato.append(
    crear('h3', '', 'Habitación ' + r.habitacion)
  );

  const detalle =
    (mostrarCliente ? r.cliente + ' · ' : '') +
    fechaLegible(r.fechaEntrada) +
    ' — ' +
    fechaLegible(r.fechaSalida);

  dato.append(crear('p', '', detalle));

  const final = crear('div', 'reserva-final');
  final.append(estado(r.estado));

  if (r.estado === 'CONFIRMADA') {
    const cancelar = crear(
      'button',
      'boton-pequeno',
      'Cancelar reserva'
    );

    cancelar.addEventListener('click', () => {
      cancelarReservaUsuario(r);
    });

    final.append(cancelar);
  }

  cont.append(dato, final);
  return cont;
}

function renderMisReservas() {
  const cont = $('#listaMisReservas');
  cont.replaceChildren();

  const propias = reservas.filter(
    r => r.correoUsuario === usuario.correo
  );

  if (!propias.length) {
    cont.append(
      crear(
        'div',
        'estado-vacio',
        'Todavía no tienes reservas. Explora nuestras habitaciones para planear tu próxima estancia.'
      )
    );
    return;
  }

  propias
    .slice()
    .reverse()
    .forEach(r => cont.append(tarjetaReserva(r)));
}


// ============================================================
// CANCELAR RESERVA
// Actualizar el estado de una reserva en MySQL.
// ============================================================

async function cancelarReservaUsuario(r) {
  // Comprobar que el usuario sea el propietario o administrador.
  // El backend vuelve a verificar estos permisos.
  const esPropietario = r.usuario_id === usuario.id;
  const esAdmin = usuario.rol === 'PERSONAL';

  if (!esPropietario && !esAdmin) {
    mensaje('No puedes modificar esta reserva.', true);
    return;
  }

  // Solicitar confirmación antes de cancelar.
  const confirmado = confirm(
    '¿Deseas cancelar la reserva de la habitación ' +
    r.habitacion +
    '?'
  );

  if (!confirmado) {
    return;
  }

  try {
    // Enviar la cancelación al backend.
    const respuesta = await solicitarApi(
      '/api/reservas/' + r.id + '/cancelar',
      {
        method: 'PATCH'
      }
    );

    // Actualizar la lista de reservas desde MySQL.
    await actualizar();

    mensaje(
      respuesta.mensaje ||
      'La reserva fue cancelada correctamente.'
    );

  } catch (err) {
    mensaje(err.message, true);
  }
}


// ============================================================
// PANEL DE ADMINISTRACIÓN
// ============================================================

function renderAdmin() {
  const tH = $('#tablaHabitaciones');
  tH.replaceChildren();

  habitaciones.forEach(h => {
    const tr = crear('tr');

    [
      h.numero,
      h.tipo,
      h.capacidad,
      'S/ ' + Number(h.precio).toFixed(2)
    ].forEach(x => celda(tr, x));

    tH.append(tr);
  });


// ============================================================
// MOSTRAR USUARIOS REGISTRADOS EN MYSQL
// ============================================================
const tC = $('#tablaClientes');
tC.replaceChildren();

clientes.forEach(c => {
  const tr = crear('tr');

  // Convertir el rol de MySQL a un texto más claro.
  const rol = c.rol === 'admin'
    ? 'Administrador'
    : 'Cliente';

  // Mostrar únicamente los datos disponibles en MySQL.
  [
    c.nombre,
    c.correo,
    rol
  ].forEach(valor => {
    celda(tr, valor);
  });

  tC.append(tr);
});



  const tR = $('#tablaTodasReservas');
  tR.replaceChildren();

  reservas.forEach(r => {
    const tr = crear('tr');

    [
      r.cliente,
      r.habitacion,
      r.fechaEntrada,
      r.fechaSalida
    ].forEach(x => celda(tr, x));

    const td = crear('td');
    td.append(estado(r.estado));
    tr.append(td);

    const accion = crear('td');
    const boton = crear('button', 'boton-pequeno', 'Cancelar');

    boton.disabled = r.estado === 'CANCELADA';

    boton.addEventListener('click', () => {
      cancelarReservaUsuario(r);
    });

    accion.append(boton);
    tr.append(accion);
    tR.append(tr);
  });
}



function ingresarEnApp() {
  const logged = Boolean(usuario);

  $('#pantallaAcceso').hidden = logged;
  $('#aplicacion').hidden = !logged;

  if (!logged) {
    return;
  }

  $('#saludoCuenta').textContent = 'Hola, ' + usuario.nombres;
  $('#enlaceAdmin').hidden = usuario.rol !== 'PERSONAL';

  navegar('inicio');

  actualizar().catch(e => {
    mensaje(e.message, true);
  });
}


// ============================================================
// EVENTOS DE REGISTRO E INICIO DE SESIÓN
// ============================================================

// Mostrar el formulario de registro.
$('#irRegistro').addEventListener('click', () => {
  uiAcceso(true);
});

// Mostrar el formulario de inicio de sesión.
$('#irLogin').addEventListener('click', () => {
  uiAcceso(false);
});

// Registrar una nueva cuenta.
$('#formRegistro').addEventListener('submit', async e => {
  e.preventDefault();

  // Guardar el formulario antes de utilizar await.
  const formulario = e.currentTarget;

  try {
    usuario = await registrarUsuario(formData(formulario));

    formulario.reset();

    ingresarEnApp();
  } catch (err) {
    errorAcceso(err.message);
  }
});

// Iniciar sesión con una cuenta existente.
$('#formLogin').addEventListener('submit', async e => {
  e.preventDefault();

  // Guardar el formulario antes de utilizar await.
  const formulario = e.currentTarget;
  const datos = formData(formulario);

  try {
    usuario = await iniciarSesion(
      datos.correo,
      datos.password
    );

    formulario.reset();

    ingresarEnApp();
  } catch (err) {
    errorAcceso(err.message);
  }
});



// ============================================================
// CERRAR SESIÓN
// Funciona para clientes y administradores.
// ============================================================

$('#cerrarSesion').addEventListener('click', () => {
  // Eliminar el token JWT y la sesión del navegador.
  cerrarSesion();

  // Limpiar los datos del usuario anterior.
  usuario = null;
  habitaciones = [];
  clientes = [];
  reservas = [];
  ultimaBusqueda = null;

  // Ocultar el sistema y mostrar el inicio de sesión.
  $('#aplicacion').hidden = true;
  $('#pantallaAcceso').hidden = false;

  // Limpiar el formulario de acceso.
  $('#formLogin').reset();

  // Mostrar la pantalla de inicio de sesión.
  uiAcceso(false);
});


// ============================================================
// EVENTOS DE NAVEGACIÓN
// ============================================================

document.querySelectorAll('[data-tab]').forEach(b => {
  b.addEventListener('click', () => {
    navegar(b.dataset.tab);
  });
});

document.querySelectorAll('[data-ir]').forEach(b => {
  b.addEventListener('click', () => {
    navegar(b.dataset.ir);
  });
});


// ============================================================
// BÚSQUEDA DE DISPONIBILIDAD
// Consulta las habitaciones libres desde MySQL.
// ============================================================

$('#formBuscar').addEventListener('submit', async e => {
  e.preventDefault();

  const formulario = e.currentTarget;
  const d = formData(formulario);
  const cont = $('#resultadoBusqueda');

  cont.replaceChildren();

  try {
    // Validar las fechas.
    if (!fechasValidas(d.entrada, d.salida)) {
      throw new Error(
        'La fecha de salida debe ser posterior a la entrada.'
      );
    }

    // Guardar las fechas de la búsqueda.
    ultimaBusqueda = d;

    // Consultar la disponibilidad real en el backend.
    const ruta =
      '/api/habitaciones/disponibilidad' +
      '?entrada=' + encodeURIComponent(d.entrada) +
      '&salida=' + encodeURIComponent(d.salida);

    const libres = await solicitarApi(ruta);

    // Mostrar un mensaje si no existen habitaciones libres.
    if (!libres.length) {
      cont.append(
        crear(
          'div',
          'estado-vacio',
          'No encontramos habitaciones disponibles para esas fechas. Prueba otro rango.'
        )
      );

      return;
    }

    // Crear el encabezado de resultados.
    const encabezado = crear('div', 'titulo-seccion');

    encabezado.append(
      crear('h2', '', 'Habitaciones disponibles')
    );

    cont.append(encabezado);

    // Mostrar las habitaciones devueltas por MySQL.
    const grid = crear('div', 'grid-habitaciones');

    libres.forEach(h => {
      const card = habitacionCard(h, 'Confirmar reserva');
      const botonOriginal = card.querySelector('button');

      // Sustituir el botón para asociarlo a esta habitación.
      const boton = botonOriginal.cloneNode(true);
      botonOriginal.replaceWith(boton);

      boton.addEventListener('click', () => {
        confirmarReserva(h);
      });

      grid.append(card);
    });

    cont.append(grid);

  } catch (err) {
    mensaje(err.message, true);
  }
});



// ============================================================
// CONFIRMAR RESERVA
// Registrar una nueva reserva directamente en MySQL.
// ============================================================

async function confirmarReserva(h) {
  if (!ultimaBusqueda) {
    return;
  }

  const d = ultimaBusqueda;

  // Solicitar confirmación al usuario.
  const confirmado = confirm(
    '¿Confirmar la reserva de la habitación ' +
    h.numero +
    ' del ' +
    fechaLegible(d.entrada) +
    ' al ' +
    fechaLegible(d.salida) +
    '?'
  );

  if (!confirmado) {
    return;
  }

  try {
    // Enviar la reserva al backend.
    // El servidor identifica al usuario mediante su token JWT.
    const respuesta = await solicitarApi('/api/reservas', {
      method: 'POST',
      body: {
        habitacion_id: h.id,
        fecha_entrada: d.entrada,
        fecha_salida: d.salida
      }
    });

    // Consultar nuevamente habitaciones y reservas desde MySQL.
    await actualizar();

    // Mostrar el historial del usuario.
    navegar('misReservas');

    mensaje(
      respuesta.mensaje ||
      '¡Tu reserva fue confirmada correctamente!'
    );

  } catch (err) {
    mensaje(err.message, true);
  }
}


// ============================================================
// FORMULARIOS DE ADMINISTRACIÓN
// Versión de demostración local.
// ============================================================


// ============================================================
// REGISTRAR HABITACIÓN
// Guardar una habitación directamente en MySQL.
// Solo para administradores.
// ============================================================

$('#formHabitacion').addEventListener('submit', async e => {
  e.preventDefault();

  // Guardar el formulario antes de utilizar await.
  const formulario = e.currentTarget;

  // Comprobar que el usuario sea administrador.
  if (usuario?.rol !== 'PERSONAL') {
    mensaje(
      'No tienes permisos para registrar habitaciones.',
      true
    );
    return;
  }

  const datos = formData(formulario);

  try {
    // Enviar la habitación al backend.
    const respuesta = await solicitarApi(
      '/api/admin/habitaciones',
      {
        method: 'POST',
        body: {
          numero: datos.numero.trim(),
          tipo: datos.tipo,
          capacidad: Number(datos.capacidad),
          precio: Number(datos.precio)
        }
      }
    );

    // Limpiar el formulario.
    formulario.reset();

    // Consultar nuevamente los datos desde MySQL.
    await actualizar();

    // Mostrar confirmación.
    mensaje(
      respuesta.mensaje ||
      'Habitación registrada correctamente.'
    );

  } catch (err) {
    mensaje(err.message, true);
  }
});



// ============================================================
// INICIALIZACIÓN SEGURA DE LA APLICACIÓN
// ============================================================

async function iniciarAplicacion() {
  // Comprobar la sesión guardada contra el backend.
  usuario = await verificarSesionActual();

  // Mostrar la aplicación únicamente si la sesión es válida.
  ingresarEnApp();
}

iniciarAplicacion();
