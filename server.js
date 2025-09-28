// server.js
import express from "express";
import cors from "cors";
import { initDb, pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ---------------- Health ----------------
app.get("/health", (_, res) => res.json({ ok: true }));

// ------------- CLIENTES -----------------

// 1) Registrar cliente (email único)
app.post("/clientes/registrar", async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body || {};
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: "nombre, email y telefono son requeridos" });
    }
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [nombre, email, telefono]
    );
    if (rows.length === 0) {
      return res.status(409).json({ error: "El email ya existe" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error registrando cliente" });
  }
});

// 2) Login cliente (valida email + telefono)
app.post("/clientes/login", async (req, res) => {
  try {
    const { email, telefono } = req.body || {};
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE email=$1 AND telefono=$2`,
      [email, telefono]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });
    res.json(rows[0]); // {id, nombre, ...}
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en login" });
  }
});

// -------------- ORDENES -----------------

// 3) Crear nueva orden
app.post("/ordenes", async (req, res) => {
  try {
    const { cliente_id, platillo_nombre, notes } = req.body || {};
    if (!cliente_id || !platillo_nombre) {
      return res.status(400).json({ error: "cliente_id y platillo_nombre son requeridos" });
    }
    const { rows } = await pool.query(
      `INSERT INTO ordenes (cliente_id, platillo_nombre, notes)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [cliente_id, platillo_nombre, notes ?? null]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando orden" });
  }
});

// 4) Listar órdenes de un cliente
app.get("/ordenes/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM ordenes
       WHERE cliente_id=$1
       ORDER BY creado DESC`,
      [clienteId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando órdenes" });
  }
});

// 5) Actualizar estado de una orden
app.put("/ordenes/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body || {};
    const allowed = ["pending", "preparing", "delivered"];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ error: `estado inválido. Use: ${allowed.join(", ")}` });
    }
    const { rows } = await pool.query(
      `UPDATE ordenes SET estado=$1 WHERE id=$2 RETURNING *`,
      [estado, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando estado" });
  }
});

// ------------- DEBUG (ver tablas y datos) -------------
app.get("/debug/health", (req, res) => res.json({ ok: true, msg: "Debug activo" }));

app.get("/debug/tables", async (req, res) => {
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('clientes','ordenes')
      ORDER BY table_name;
    `);
    const clientesCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='clientes'
      ORDER BY ordinal_position;
    `);
    const ordenesCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='ordenes'
      ORDER BY ordinal_position;
    `);
    const sampleClientes = (await pool.query(`SELECT * FROM clientes ORDER BY id DESC LIMIT 5`)).rows;
    const sampleOrdenes  = (await pool.query(`SELECT * FROM ordenes ORDER BY id DESC LIMIT 5`)).rows;

    res.json({
      ok: true,
      tables: tables.rows.map(r => r.table_name),
      columns: { clientes: clientesCols.rows, ordenes: ordenesCols.rows },
      sample: { clientes: sampleClientes, ordenes: sampleOrdenes }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------ Arranque ------------
const PORT = process.env.PORT || 8080;
initDb()
  .then(() => app.listen(PORT, () => console.log(`API lista en puerto ${PORT}`)))
  .catch((err) => {
    console.error("[APP] Falló la inicialización de DB:", err.message);
    process.exit(1);
  });
