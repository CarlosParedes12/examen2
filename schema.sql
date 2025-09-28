-- Crear BD (si ejecutas fuera de Render)
-- CREATE DATABASE restaurante_ordenes_db;

-- Tablas
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  email    VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id),
  platillo_nombre VARCHAR(150) NOT NULL,
  notes TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pending',
  creado TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Datos de ejemplo (opcionales)
-- INSERT INTO clientes (nombre, email, telefono) VALUES
-- ('Ana López','ana@correo.com','999-999'),
-- ('Juan Pérez','juan@correo.com','888-888');
