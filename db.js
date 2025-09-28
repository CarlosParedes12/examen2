import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// Normaliza postgres:// a postgresql:// si hace falta
const fixedUrl = (process.env.DATABASE_URL || "")
  .replace(/^postgres:\/\//, "postgresql://");

export const pool = new Pool({
  connectionString: fixedUrl,
  ssl: fixedUrl.includes("render.com") ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  // Crea tablas si no existen (según el enunciado)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email  VARCHAR(150) UNIQUE NOT NULL,
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
  `);
  console.log("[DB] Tablas listas");
}
