// server.js
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_, res) => res.json({ ok: true }));

// ...tus rutas /clientes y /ordenes ...

const PORT = process.env.PORT || 8080;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API lista en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error("[APP] Falló la inicialización de DB:", err.message);
    process.exit(1);
  });
