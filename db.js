// db.js
import fs from "fs";
import path from "path";
import pkg from "pg";
const { Pool } = pkg;

// Conexión al pool de PostgreSQL (Render provee DATABASE_URL en variables de entorno)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render requiere SSL
});

// Inicializa la DB y ejecuta schema.sql al arrancar
export async function initDb() {
  console.log("[DB] Inicializando conexión...");

  const client = await pool.connect();
  try {
    const schemaPath = path.join(process.cwd(), "schema.sql");
    console.log("[DB] Ejecutando schema.sql en:", schemaPath);

    const schema = fs.readFileSync(schemaPath, "utf-8");
    await client.query(schema);

    console.log("[DB] Tablas verificadas/creadas con éxito ✅");
  } catch (err) {
    console.error("[DB] Error ejecutando schema.sql:", err.message);
    throw err;
  } finally {
    client.release();
  }
}
