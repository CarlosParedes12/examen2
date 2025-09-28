// server.js
import express from "express";
import cors from "cors";
import { initDb, pool } from "./db.js";  // asegúrate que db.js exporte pool también

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check básico
app.get("/health", (_, res) => res.json({ ok: true }));

// Aquí irán tus rutas reales de clientes y órdenes
// por ejemplo:
// app.post("/clientes/registrar", async (req,res)=>{ ... });
// app.post("/clientes/login", async (req,res)=>{ ... });
// app.post("/ordenes", async (req,res)=>{ ... });
// app.get("/ordenes/:clienteId", async (req,res)=>{ ... });
// app.put("/ordenes/:id/estado", async (req,res)=>{ ... });

/* ------------------------------------------------------------------
   DEBUG: endpoints para verificar tablas y datos en la base de datos
-------------------------------------------------------------------*/

// Ping rápido para probar
app.get("/debug/health", (req, res) => {
  res.json({ ok: true, msg: "Debug activo" });
});

// Verifica si existen las tablas y muestra algunas filas
app.get("/debug/tables", async (req, res) => {
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('clientes', 'ordenes')
      ORDER BY table_name;
    `);

    const clientesCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clientes'
      ORDER BY ordinal_position;
    `);

    const ordenesCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ordenes'
      ORDER BY ordinal_position;
    `);

    let clientesSample = [];
    let ordenesSample = [];

    try {
      const r1 = await pool.query(`SELECT * FROM clientes ORDER BY id DESC LIMIT 5;`);
      clientesSample = r1.rows;
    } catch (_) {}

    try {
      const r2 = await pool.query(`SELECT * FROM ordenes ORDER BY id DESC LIMIT 5;`);
      ordenesSample = r2.rows;
    } catch (_) {}

    res.json({
      ok: true,
      tables: tables.rows.map(r => r.table_name),
      columns: {
        clientes: clientesCols.rows,
        ordenes: ordenesCols.rows,
      },
      sample: {
        clientes: clientesSample,
        ordenes: ordenesSample,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ------------------------------------------------------------------ */

const PORT = process.env.PORT || 8080;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API lista en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error("[APP] Falló la inicialización de DB:", err.message);
    process.exit(1);
  });
