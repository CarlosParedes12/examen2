import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initDb } from "./db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // sirve el frontend

// Health
app.get("/health", (_, res) => res.json({ status: "ok" }));

/**
 * 1) POST /clientes/register
 * body: { nombre, email, telefono }
 * valida email único
 */
app.post("/clientes/register", async (req, res) => {
  const { nombre, email, telefono } = req.body || {};
  if (!nombre || !email || !telefono) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  try {
    const dup = await pool.query("SELECT 1 FROM clientes WHERE email=$1", [email]);
    if (dup.rowCount > 0) {
      return res.status(400).json({ error: "Email ya registrado" });
    }
    const { rows } = await pool.query(
      "INSERT INTO clientes (nombre, email, telefono) VALUES ($1,$2,$3) RETURNING *",
      [nombre, email, telefono]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar cliente" });
  }
});

/**
 * 2) POST /clientes/login
 * body: { email, telefono }
 * simula validación
 */
app.post("/clientes/login", async (req, res) => {
  const { email, telefono } = req.body || {};
  if (!email || !telefono) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM clientes WHERE email=$1 AND telefono=$2",
      [email, telefono]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    res.json({ ok: true, cliente: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en login" });
  }
});

/**
 * 3) POST /ordenes
 * body: { cliente_id, platillo_nombre, notes }
 */
app.post("/ordenes", async (req, res) => {
  const { cliente_id, platillo_nombre, notes } = req.body || {};
  if (!cliente_id || !platillo_nombre) {
    return res.status(400).json({ error: "cliente_id y platillo_nombre son requeridos" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO ordenes (cliente_id, platillo_nombre, notes)
       VALUES ($1,$2,$3) RETURNING *`,
      [cliente_id, platillo_nombre, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear orden" });
  }
});

/**
 * 4) GET /ordenes/:clienteId
 * lista pedidos de un cliente
 */
app.get("/ordenes/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT o.*, c.nombre as cliente_nombre
         FROM ordenes o
         JOIN clientes c ON c.id = o.cliente_id
        WHERE o.cliente_id = $1
        ORDER BY o.creado DESC`,
      [clienteId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar órdenes" });
  }
});

/**
 * 5) PUT /ordenes/:id/estado
 * body: { estado } -> pending | preparing | delivered
 * (Si quieres forzar flujo, puedes validar el paso permitido)
 */
app.put("/ordenes/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body || {};
  const allowed = ["pending", "preparing", "delivered"];
  if (!allowed.includes(estado)) {
    return res.status(400).json({ error: "estado inválido" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE ordenes SET estado=$1 WHERE id=$2 RETURNING *",
      [estado, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// (Opcional si hay tiempo) DELETE /ordenes/:id
// app.delete("/ordenes/:id", async (req, res) => { ... });

const PORT = process.env.PORT || 8080;
initDb().then(() => {
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
});
