# CLAUDE.md — Recessed Minds

Guía de referencia del proyecto para Claude Code. Describe el estado actual del stack, arquitectura y decisiones técnicas.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend framework | Astro 5 (`output: 'server'`) |
| UI interactiva | Preact islands (`client:load`, `client:visible`, `client:only`) |
| Backend | Astro API Routes (SSR) — **sin servidor Express separado** |
| Base de datos + Auth | Supabase (PostgreSQL + GoTrue) |
| Deploy | Vercel (`@astrojs/vercel`) |
| CSS | CSS nativo con custom properties — sin Tailwind |

---

## Estructura del proyecto

```
frontend/
├── src/
│   ├── pages/
│   │   ├── index.astro                  # Landing principal
│   │   ├── dashboard.astro              # Dashboard post-login (protegido)
│   │   └── api/v1/
│   │       ├── auth/
│   │       │   ├── login.ts             # POST — signInWithPassword (supabaseAuth)
│   │       │   ├── register.ts          # POST — createUser admin + insert profile
│   │       │   ├── logout.ts            # POST — signOut admin + limpiar cookie
│   │       │   ├── refresh.ts           # POST — refreshSession con cookie
│   │       │   └── me.ts                # GET — verificar JWT, devuelve usuario
│   │       └── comments/
│   │           ├── index.ts             # GET (cursor paginado) + POST (requiere auth)
│   │           └── [id].ts              # PATCH + DELETE (solo owner)
│   ├── components/
│   │   ├── Layout.astro
│   │   ├── Nav.astro                    # Navbar fija + menú móvil overlay
│   │   ├── Hero.astro
│   │   ├── CharacterCard.astro          # Flip card (CSS hover + JS tap)
│   │   ├── CharactersGrid.astro
│   │   ├── PosterGallery.astro
│   │   ├── StatsBar.astro
│   │   ├── Story.astro
│   │   ├── BodyShots.astro
│   │   ├── Comments.astro               # Wrapper sección comunidad
│   │   ├── Footer.astro
│   │   ├── AuthLauncher.jsx             # Preact island: badge usuario + dropdown + modal
│   │   ├── ModalAuth.jsx                # Preact: modal login/registro
│   │   ├── CommentsWidget.jsx           # Preact: grid comentarios + form
│   │   ├── Dashboard.jsx                # Preact: dashboard del usuario
│   │   └── Toast.jsx                    # Preact: notificaciones toast
│   ├── lib/
│   │   ├── api.js                       # Cliente fetch del frontend (createComment, login, etc.)
│   │   └── supabase.ts                  # Dos clientes Supabase + helpers
│   └── styles/
│       └── global.css                   # Variables CSS + reset + componentes globales
├── public/
│   └── images/                          # Logo.png, personajes, posters
├── astro.config.mjs                     # output: server, adapter: vercel, preact compat: true
└── .env.local                           # Variables de entorno (no commitear)
```

---

## Autenticación

### Dos clientes Supabase (`src/lib/supabase.ts`)

```ts
supabaseAdmin  // service_role key — operaciones DB, crear usuario admin
supabaseAuth   // anon key       — signInWithPassword, refreshSession
```

**Nunca usar `supabaseAdmin` para autenticar usuarios** — devuelve 401. Solo `supabaseAuth` puede verificar contraseñas.

### Flujo de sesión

1. Login/Register → `accessToken` en `localStorage` (`rm_token`) + `user` en `localStorage` (`rm_user`) + cookie `rm_refresh` (HttpOnly, 7 días)
2. Requests autenticados → `fetchWithAuth()` en `api.js` envía `Authorization: Bearer <token>`
3. Si 401 → intenta `POST /api/v1/auth/refresh` con la cookie, renueva el token
4. Logout → limpia localStorage + invalida cookie con `Max-Age=0`

### Tabla `profiles` en Supabase

```sql
id        uuid (FK → auth.users.id)
username  text
email     text
created_at timestamptz
```

La contraseña NO se guarda aquí — vive en `auth.users` (tabla interna de Supabase).

---

## Componentes clave

### `AuthLauncher.jsx` (`client:only="preact"` en el slot del nav)

- Estado inicial: `useState(() => loadSession()?.user ?? null)` — lee localStorage en el primer render, **sin flash**
- Si hay sesión: muestra badge con avatar (iniciales) + nombre + dropdown
- Dropdown: Dashboard · Publicar reseña · Cerrar sesión
- Modal y Toast se renderizan con `createPortal(…, document.body)` para evitar ser atrapados por el stacking context del nav (z-index: 500)
- Tras login: redirige a `/dashboard`

### `CommentsWidget.jsx` (`client:visible`)

- Carga 9 comentarios iniciales; si la API falla usa seed data local
- `createComment` usa `fetchWithAuth` (envía Bearer token)
- Muestra formulario si `loadSession()` devuelve sesión, prompt de login si no

### `Dashboard.jsx` (`client:load`)

- Verifica sesión en localStorage → redirige a `/` si no hay sesión
- Confirma token vía `GET /api/v1/auth/me`
- Muestra: stats (reseñas, calificación media, 5★, estado), mis comentarios (editar/eliminar), panel lateral con lore + actividad reciente, barra de sanidad animada

### `Nav.astro`

- Script vanilla JS que actualiza el overlay móvil según localStorage (sin esperar hidratación Preact)
- El `nav-overlay-auth` se reemplaza con "Mi Perfil" + logout si hay sesión activa

---

## CSS

### Variables principales

```css
--violet: #2E1065     --red: #661214       --blue: #183348
--violet-mid: #3d1580 --red-bright: #8B1A1D
--yellow: #D9D327     --green: #3ABC20
--black: #070707      --beige: #DCD6C4     --beige-dim: #a09a8c

--font-display: 'Cinzel', serif
--font-body:    'Rajdhani', sans-serif
--font-tech:    'Orbitron', sans-serif
```

### Convenciones

- **Mobile-first**: `min-width` breakpoints (480, 640, 768, 900, 1024px)
- `clamp()` para tipografía y tamaños fluidos
- `@media (hover: hover)` para separar interacciones touch vs mouse
- `100svh` para altura de viewport móvil
- Clases globales con prefijo por componente: `.db-*` (dashboard), `.nav-*`, `.comment-*`

---

## API endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Crea usuario + perfil |
| POST | `/api/v1/auth/login` | No | Devuelve accessToken + cookie |
| POST | `/api/v1/auth/logout` | Cookie | Invalida sesión |
| POST | `/api/v1/auth/refresh` | Cookie | Renueva accessToken |
| GET | `/api/v1/auth/me` | Bearer | Devuelve usuario actual |
| GET | `/api/v1/comments` | No | Lista con cursor paginado (`?cursor=&limit=&userId=`) |
| POST | `/api/v1/comments` | Bearer | Crea comentario |
| PATCH | `/api/v1/comments/:id` | Bearer (owner) | Edita contenido |
| DELETE | `/api/v1/comments/:id` | Bearer (owner) | Elimina |

---

## Variables de entorno

```env
# frontend/.env.local
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`PUBLIC_*` son accesibles en el cliente. `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.

---

## Reglas importantes

- **No crear servidor Express separado** — el backend son las API routes de Astro en `src/pages/api/`
- **No usar `supabaseAdmin` para login/register** — usar `supabaseAuth` con la anon key
- **`createComment` y otras mutaciones** deben usar `fetchWithAuth` para incluir el Bearer token
- **Modales y overlays** que se rendericen dentro de un Preact island anidado en el nav deben usar `createPortal(…, document.body)` para evitar problemas de z-index
- El `compat: true` en `astro.config.mjs` es requerido para `createPortal`
- Las contraseñas **nunca** se guardan en la tabla `profiles` — Supabase las maneja internamente

---

## Comandos

```bash
cd frontend
npm run dev      # Servidor de desarrollo (puerto 4321)
npm run build    # Build de producción
npm run preview  # Preview del build
```
