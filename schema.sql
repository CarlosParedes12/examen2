-- =========================================================
-- Script schema.sql
-- Base de datos: examen2db (PostgreSQL en Render)
-- Crea las tablas necesarias para la práctica de restaurante
-- =========================================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  email    VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(50) NOT NULL
);

-- Órdenes
CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  platillo_nombre VARCHAR(150) NOT NULL,
  notes TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pending',
  creado TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Datos de prueba (opcional, comenta si no lo quieres)
-- =========================================================
INSERT INTO clientes (nombre, email, telefono)
VALUES
  ('Ana López','ana@correo.com','999-999'),
  ('Juan Pérez','juan@correo.com','888-888')
ON CONFLICT (email) DO NOTHING;

INSERT INTO ordenes (cliente_id, platillo_nombre, notes, estado)
VALUES
  (1, 'Pizza Margarita', 'Sin queso extra', 'pending'),
  (2, 'Tacos al pastor', 'Con piña', 'preparing');
