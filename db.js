// db.js (ESM)
import pg from "pg";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

// Resuelve ruta absoluta al schema.sql (raíz del proyecto)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "schema.sql");

// Normaliza la URL de conexión y configura SSL solo si es externa
let conn = process.env.DATABASE_URL || "";
conn = conn.replace(/^postgres:\/\//, "postgresql://");
const needsSSL = conn.includes("render.com") || conn.includes("sslmode=require");

export const pool = new Pool({
  connectionString: conn,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  if (!conn) {
    console.error("[DB] DATABASE_URL no está definida. Configúrala en Render → Environment.");
    throw new Error("DATABASE_URL missing");
  }

  // 1) Probar conexión
  await pool.query("SELECT 1");
  console.log("[DB] Conexión OK");

  // 2) Ejecutar schema.sql (idempotente por tus CREATE TABLE IF NOT EXISTS)
  try {
    const sql = await readFile(schemaPath, "utf8");
    // Opcional: filtra líneas CREATE DATABASE si no están comentadas
    const cleaned = sql
      .split("\n")
      .filter(line => !/^--\s*CREATE DATABASE/i.test(line.trim()))
      .join("\n");

    await pool.query(cleaned);
    console.log("[DB] schema.sql aplicado (o ya existía)");
  } catch (e) {
    console.error("[DB] No se pudo aplicar schema.sql:", e.message);
    throw e;
  }
}
