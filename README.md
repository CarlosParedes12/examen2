# Restaurante Órdenes (Node + Express + PostgreSQL)

API REST + Frontend JS puro. Despliegue en Render.

## Endpoints
- POST /clientes/register
- POST /clientes/login
- POST /ordenes
- GET  /ordenes/:clienteId
- PUT  /ordenes/:id/estado
- GET  /health

## Variables de entorno
- DATABASE_URL (Internal URL de la DB en Render)
- PORT (opcional, por defecto 8080)

## Dev local
```bash
npm install
cp .env.example .env   # coloca tu cadena
npm run dev
