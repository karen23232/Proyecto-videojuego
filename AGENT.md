# AGENT.md - Recessed Minds Landing Page con Astro

## Objetivo

Migrar el landing page estático `recessed_minds_FINAL.html` a Astro + Preact, manteniendo el diseño exacto mientras se reduce el JS y se mejoran las prácticas de UI/UX.

## Stack Tecnológico

- **Astro** - Framework principal (SSG + Islands)
- **Preact** - Para componentes interactivos (3KB)
- **CSS nativo** - Manteniendo el diseño actual (sin Tailwind)
- **Backend** - Express API REST existente (se mantiene sin cambios)

## Estructura del Proyecto

```
/
├── backend/                              # API REST (sin cambios)
├── src/
│   ├── components/
│   │   ├── Layout.astro                  # Head, fonts, CSS variables, skip-link
│   │   ├── Nav.astro                     # Navegación fija + mobile hamburger
│   │   ├── Hero.astro                    # Hero + particles CSS-only
│   │   ├── CharacterCard.astro            # Flip card individual
│   │   ├── CharactersGrid.astro           # Grid de personajes
│   │   ├── PosterGallery.astro           # Galería pósters
│   │   ├── StatsBar.astro                # Estadísticas
│   │   ├── Story.astro                   # Historia + features
│   │   ├── Comments.astro                # Comentarios + form
│   │   ├── Footer.astro                  # Footer
│   │   ├── ModalAuth.jsx                 # Preact island (auth)
│   │   ├── StarRating.jsx                # Preact island (rating)
│   │   └── Toast.jsx                      # Preact island (notificaciones)
│   ├── pages/
│   │   ├── index.astro                   # Landing principal
│   │   ├── comunidad.astro               # Comunidad/ranking
│   │   └── blog.astro                    # Blog desarrollo
│   ├── styles/
│   │   └── global.css                    # CSS variables + reset + animations
│   └── lib/
│       └── api.js                        # Cliente fetch para backend
├── public/
│   └── images/                           # Imágenes optimizadas
├── astro.config.mjs
└── package.json
```

## CSS vs JavaScript

### CSS-only (sin JS)

| Sección | Implementación |
|---------|----------------|
| Animaciones entrada (fadeUp) | CSS `@keyframes` con delay |
| Flip cards | CSS hover + `transform-style: preserve-3d` |
| Particles (infinitas) | CSS-only (30 elementos `<span>` con delays escalonados) |
| Scroll indicator | CSS `@keyframes scrollPulse` |
| Stats count-up | CSS-only con `step-end` animation |
| Hero grid | CSS gradients |
| Hover states | CSS transitions |

### Preact Islands (JS mínimo)

| Componente | Directiva | Justificación |
|------------|-----------|----------------|
| ModalAuth | `client:load` | Visible al inicio, necesita interactividad inmediata |
| StarRating | `client:visible` | Solo carga cuando el form es visible |
| Toast | `client:visible` | Solo cuando hay notificaciones |

## UI/UX Best Practices

### Accesibilidad
- Skip to content link (`<a href="#main" class="skip-link">`)
- `:focus-visible` con outline visible (rojo/amarillo del diseño)
- ARIA: `role="dialog"` en modal, `aria-required` en inputs
- `@media (prefers-reduced-motion: reduce)` para todas las animaciones
- Keyboard navigation: ESC para cerrar modal

### Responsive
- Mobile (< 768px): Grid 1-col, nav hamburger, padding reducido
- Tablet (768-1024): Grid 2-col adaptado
- Desktop (> 1024): Layout completo
- Touch targets: mínimo 44px

### Performance
- `loading="lazy"` en imágenes (excepto hero)
- `font-display: swap` para fuentes
- Astro elimina CSS no utilizado
- Preact (~3KB) en lugar de React

## Fases de Implementación

### Fase 1: Setup
```bash
npm create astro@latest
# Elegir: Empty project, TypeScript (opcional), Install dependencies
npx astro add preact
```

### Fase 2: Estilos Base
1. Crear `src/styles/global.css`
2. Extraer variables CSS del HTML original
3. Crear `src/components/Layout.astro` con fonts preload

### Fase 3: Componentes Estáticos
1. Nav.astro
2. Hero.astro (+ particles CSS)
3. CharacterCard.astro
4. CharactersGrid.astro
5. PosterGallery.astro
6. StatsBar.astro
7. Story.astro
8. Comments.astro
9. Footer.astro

### Fase 4: Preact Islands
1. ModalAuth.jsx - Login/Register con fetch al backend
2. StarRating.jsx
3. Toast.jsx

### Fase 5: Páginas
1. index.astro
2. comunidad.astro
3. blog.astro

### Fase 6: Integración Backend
1. Crear `src/lib/api.js`
2. Conectar ModalAuth con API
3. Guardar JWT en localStorage

### Fase 7: Optimización
1. Reemplazar base64 por imágenes en `/public/images/`

## Imágenes del Proyecto

El proyecto tiene imágenes en formato base64 en el HTML. Por ahora se mantienen como están. Para optimizarla posteriormente:
- Extraer las base64 a archivos individuales
- Guardar en `/public/images/`
- Usar `<img src="/images/nombre.jpg" />`

## Notas Importantes

1. **No modificar el backend** - Se mantiene en `/backend/` como API REST
2. **Mantener diseño exacto** - Cada CSS debe ser idéntico al original
3. **Reducir JS** - Solo Preact para interactividad necesaria
4. **Imágenes** - Por ahora mantener base64, optimizar después

## Scripts Disponibles

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview"
}
```

## Conexión con Backend

El backend Express está en `localhost:3000`. Endpoints esperados:
- `POST /api/auth/register`
- `POST /api/auth/login`

El frontend Astro debe hacer fetch a estos endpoints desde los componentes Preact.

## Implementación Ideal del Backend (Roadmap)

Para escalar este proyecto de forma segura y mantenible, la implementación recomendada del backend es:

### Arquitectura por capas

- `routes`: define endpoints y middlewares HTTP
- `controllers`: recibe request/response y delega
- `services`: lógica de negocio
- `repositories`: acceso a DB
- `models`: esquemas Mongoose

Estructura sugerida:

```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
      db.js
      cors.js
      logger.js
    common/
      errors/
        AppError.js
        errorHandler.js
      middlewares/
        authMiddleware.js
        validate.js
        rateLimiter.js
      utils/
        asyncHandler.js
        jwt.js
        response.js
    modules/
      auth/
        auth.routes.js
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validation.js
      users/
        user.model.js
        user.routes.js
        user.controller.js
        user.service.js
        user.repository.js
      comments/
        comment.model.js
        comment.routes.js
        comment.controller.js
        comment.service.js
        comment.repository.js
        comment.validation.js
      health/
        health.routes.js
  tests/
    auth.integration.test.js
    comments.integration.test.js
```

### Endpoints recomendados (v1)

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Comments:
  - `GET /api/v1/comments?cursor=&limit=`
  - `POST /api/v1/comments`
  - `PATCH /api/v1/comments/:id` (admin opcional)
  - `DELETE /api/v1/comments/:id` (admin opcional)
- Health:
  - `GET /api/v1/health`

### Seguridad y autenticación

- JWT con `access token` corto (15-30 min)
- `refresh token` rotativo en cookie `HttpOnly`
- `bcrypt` para hash de contraseñas
- `helmet`, `cors` por entorno, `rate limit`
- Validación con Zod/Joi + sanitización

### Variables de entorno mínimas

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=<uri>
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_ORIGIN=http://localhost:4321
LOG_LEVEL=info
```

### Modelo recomendado de comentarios

- `userId` (nullable para invitado)
- `authorName`
- `rating` (1..5)
- `content`
- `status` (`active|hidden`)
- `createdAt`, `updatedAt`

### Plan de migración incremental

1. Reorganizar auth por capas sin romper contratos actuales
2. Agregar middleware global de errores y validación
3. Implementar módulo `comments` persistente en MongoDB
4. Migrar frontend de comentarios a API backend
5. Añadir refresh/logout seguros
6. Incorporar tests de integración + CI
