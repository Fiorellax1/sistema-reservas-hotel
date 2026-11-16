import test from 'node:test';
import assert from 'node:assert/strict';
import {fechasValidas, seSuperponen, habitacionesDisponibles, crearReserva, cancelarReserva} from '../frontend/js/reservas.js';
const habitaciones = [{id:1, numero:'101', activa:true}, {id:2, numero:'102', activa:true}, {id:3, numero:'103', activa:false}];
const clientes = [{id:1, nombres:'Ana', apellidos:'Pérez'}];
const reserva = {id:1, habitacionId:1, fechaEntrada:'2026-11-20', fechaSalida:'2026-11-25', estado:'CONFIRMADA'};
const nueva = {habitacionId:2, clienteId:1, fechaEntrada:'2026-11-21', fechaSalida:'2026-11-23'};
test('V1: sin fechas informadas no es válido', () => assert.equal(fechasValidas('', ''), false));
test('V2: la salida debe ser posterior a la entrada', () => {
  assert.equal(fechasValidas('2026-11-20','2026-11-20'), false);
  assert.equal(fechasValidas('2026-11-21','2026-11-20'), false);
  assert.equal(fechasValidas('2026-11-20','2026-11-21'), true);
});
test('V2: consultar con fechas inválidas lanza un error', () => assert.throws(() => habitacionesDisponibles(habitaciones, [], '2026-02-30','2026-03-02')));
test('V3: detecta rangos superpuestos y permite rangos contiguos', () => {
  assert.equal(seSuperponen('2026-11-20','2026-11-25','2026-11-22','2026-11-27'),true);
  assert.equal(seSuperponen('2026-11-20','2026-11-25','2026-11-25','2026-11-27'),false);
});
test('V3: no muestra habitaciones con reservas confirmadas superpuestas', () => assert.deepEqual(habitacionesDisponibles(habitaciones,[reserva],'2026-11-21','2026-11-24').map(h=>h.id),[2]));
test('V3: las reservas canceladas no bloquean la habitación', () => assert.deepEqual(habitacionesDisponibles(habitaciones,[{...reserva,estado:'CANCELADA'}],'2026-11-21','2026-11-24').map(h=>h.id),[1,2]));
test('V3: las habitaciones no disponibles no se ofrecen', () => assert.deepEqual(habitacionesDisponibles(habitaciones,[],'2026-11-21','2026-11-24').map(h=>h.id),[1,2]));
test('crearReserva registra una reserva confirmada', () => {
  const resultado = crearReserva([],habitaciones,clientes,nueva);
  assert.equal(resultado.length,1);assert.equal(resultado[0].estado,'CONFIRMADA');assert.equal(resultado[0].habitacionId,2);
});
test('V3: crearReserva rechaza una habitación ocupada', () => assert.throws(() => crearReserva([reserva],habitaciones,clientes,{...nueva,habitacionId:1}),/reservada/));
test('cancelarReserva cambia el estado sin alterar la lista original', () => {
  const original=[reserva];const resultado=cancelarReserva(original,1);
  assert.equal(resultado[0].estado,'CANCELADA');assert.equal(original[0].estado,'CONFIRMADA');
});
