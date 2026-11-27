
-- ============================================================
-- HOTEL ANDINO
-- Base de datos del Sistema de Gestión de Reservas
-- Motor: MySQL 8
-- ============================================================

-- 1. CREACIÓN DE LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS hotel_andino
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hotel_andino;


-- ============================================================
-- 2. TABLA: USUARIOS
-- Almacena los clientes y administradores del sistema.
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. TABLA: HABITACIONES
-- Almacena la información de las habitaciones del hotel.
-- ============================================================

CREATE TABLE IF NOT EXISTS habitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('disponible', 'mantenimiento')
        NOT NULL DEFAULT 'disponible',
    descripcion TEXT,

    CONSTRAINT chk_capacidad
        CHECK (capacidad > 0),

    CONSTRAINT chk_precio
        CHECK (precio >= 0)
);


-- ============================================================
-- 4. TABLA: RESERVAS
-- Relaciona usuarios y habitaciones con sus fechas de reserva.
-- ============================================================

CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    habitacion_id INT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    estado ENUM('confirmada', 'cancelada')
        NOT NULL DEFAULT 'confirmada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_reserva_habitacion
        FOREIGN KEY (habitacion_id)
        REFERENCES habitaciones(id),

    CONSTRAINT chk_fechas
        CHECK (fecha_salida > fecha_entrada)
);


-- ============================================================
-- 5. VERIFICACIÓN
-- Muestra las tablas creadas en la base de datos.
-- ============================================================

SHOW TABLES;
