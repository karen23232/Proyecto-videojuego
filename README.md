# Recessed Minds

Proyecto full stack con:

- `frontend/`: landing en Astro + Preact
- `backend/`: API de autenticación con Express + MongoDB

## Requisitos

- Node.js `>= 22.12.0` (recomendado usar la versión indicada en `frontend/package.json`)
- npm
- MongoDB (local o Atlas)

## 1) Clonar e instalar dependencias

Desde la raíz del repo:

```bash
git clone <URL_DEL_REPO>
cd Proyecto-videojuego

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2) Configurar variables de entorno (backend)

En `backend/.env` define al menos:

```env
PORT=3000
MONGODB_URI=<tu_conexion_mongodb>
JWT_SECRET=<tu_clave_secreta>
```

Notas:

- El frontend consume la API en `http://localhost:3000/api/auth` (ver `frontend/src/lib/api.js`).
- Si cambias `PORT`, actualiza también esa URL en `frontend/src/lib/api.js`.

## 3) Ejecutar en desarrollo

Abre **dos terminales**.

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

## 4) URLs locales

- Frontend: `http://localhost:4321`
- Backend: `http://localhost:3000`
- Health check backend: `http://localhost:3000/`

## Scripts útiles

### Backend (`backend/`)

- `npm run dev`: levanta servidor con nodemon
- `npm start`: levanta servidor con node

### Frontend (`frontend/`)

- `npm run dev`: entorno de desarrollo
- `npm run build`: build de producción
- `npm run preview`: previsualiza el build

## Build de producción (frontend)

```bash
cd frontend
npm run build
npm run preview
```
