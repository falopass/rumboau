# Rumbo AU

Tablero comunitario público para ordenar fechas, estados, documentos declarados,
bancos usados para acreditar fondos y consejos de postulaciones Working Holiday
Australia. La edición se protege con una contraseña por participante. Se
recopila un móvil chileno para verificación manual del grupo, pero la vista
pública solo expone una versión enmascarada; no se suben archivos.

> Rumbo AU no pertenece al Gobierno de Australia y no entrega asesoría migratoria
> ni predicciones de resolución.

## Stack

- Next.js 16 App Router, React 19 y TypeScript estricto.
- Tailwind CSS 4 más un sistema visual propio documentado en `DESIGN.md`.
- Supabase PostgreSQL y Supabase Auth para administradores.
- Zod, React Hook Form, Argon2id y sesiones JWT `HttpOnly`.
- Vitest y Playwright.

Node.js 20.9 o posterior es requerido. Las versiones de Supabase se mantienen
en la última línea compatible con Node 20; al actualizar a Supabase 2.110 o
superior hay que migrar primero a Node 22.

## Instalación

```powershell
npm install
Copy-Item .env.example .env.local
```

Para ver la aplicación sin credenciales externas:

```powershell
npm run dev
```

En desarrollo, el modo demo se activa automáticamente cuando falta alguna
credencial de Supabase. Solo funciona con `NODE_ENV !== production`; sus datos
son ficticios y se reinician con el proceso. Contraseña de participantes demo:
`rumbo-demo-2026`. El acceso administrativo demo aparece completado en
`/admin/login`.

Para conectar Supabase, copia `.env.example` a `.env.local`, completa las tres
variables de Supabase y reinicia `npm run dev`. Nunca pegues la
`SUPABASE_SERVICE_ROLE_KEY` en una variable `NEXT_PUBLIC_*`.

En Vercel, el recurso oficial Supabase Marketplace administra e inyecta esas
credenciales en Production, Preview y Development. No copies sus valores al
repositorio: `vercel env pull .env.local` sincroniza el entorno local.

## Variables

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura de la proyección pública y Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Mutaciones server-only; jamás usar en cliente |
| `SESSION_SECRET` | Firma de sesiones de participantes, mínimo 32 caracteres |
| `RATE_LIMIT_SALT` | HMAC de IP; evita almacenar direcciones crudas |
| `RUMBO_DEMO_MODE` | Fuerza demo local; también se activa si faltan credenciales |

No se deben pegar secretos en el repositorio, logs o conversaciones.

## Supabase

1. Crear un proyecto Supabase.
2. Ejecutar en orden las migraciones de `supabase/migrations` mediante
   Supabase CLI o el SQL Editor.
3. Configurar las variables anteriores.
4. Crear el primer usuario administrativo en Supabase Auth con correo y
   contraseña.
5. Promoverlo desde SQL:

```sql
insert into public.admin_users (user_id, display_name)
select id, 'Administración'
from auth.users
where email = 'tu-correo@ejemplo.cl'
on conflict (user_id) do update set active = true;
```

La migración:

- habilita RLS en todas las tablas;
- revoca acceso directo a tablas para `anon` y `authenticated`;
- expone solo la vista curada `public_application_board`;
- reserva RPC de escritura para el servidor;
- mantiene auditoría administrativa y recuperación de un solo uso.

No hay bucket de Storage porque Rumbo AU no acepta documentos reales.

## Flujos principales

- `/`: tablero público, métricas y filtros persistentes.
- `/postulaciones/nueva`: alta y consentimiento de publicación.
- `/postulaciones/[id]`: ficha, línea temporal y compartir.
- `/postulaciones/[id]/editar`: validación de contraseña.
- `/mi-registro`: múltiples intentos, documentos, bancos y consejos.
- `/admin`: moderación, recuperación, CSV y resumen de WhatsApp.

El promedio de espera usa exclusivamente postulaciones marcadas como
`granted` que tengan fecha de resolución. Es un resumen de los registros
comunitarios, no una predicción ni un plazo oficial.

La membresía de WhatsApp no puede comprobarse automáticamente con un número:
administración contrasta manualmente el teléfono privado y activa la marca
“Grupo verificado”. Públicamente se muestra en formato `+569XXXXX999`.

La recuperación genera un token SHA-256 de un solo uso con vencimiento de 24
horas. El administrador copia el enlace y lo envía manualmente; nunca ve la
contraseña nueva.

## Validación

```powershell
npm run lint
npm run typecheck
npm test
npm run assets:brand
npm run assets:optimize
npm run build
npx playwright install chromium
npm run test:e2e
```

Los E2E levantan automáticamente el modo demo. El build no requiere credenciales
porque todas las rutas de datos son dinámicas, pero una ejecución productiva sí.

## Despliegue

1. Crear el proyecto en Vercel o un runtime Node compatible.
2. Configurar todas las variables excepto `RUMBO_DEMO_MODE`.
3. Ejecutar la migración en Supabase antes de publicar la aplicación.
4. Verificar login administrativo, RLS, CSV, recuperación y un alta real de
   prueba antes de invitar al grupo.

La aplicación utiliza `noindex` y `robots.txt` cerrado porque muestra nombres o
alias y actividad comunitaria. Cambiar esa decisión requiere renovar el
consentimiento, no solo editar metadata.

## Estructura

- `app/`: rutas, Server Actions y endpoints.
- `components/`: tablero, formularios, administración y marca.
- `lib/`: dominio, seguridad, repositorios demo/Supabase y validación.
- `supabase/`: migración y seed de desarrollo.
- `public/visuals/`: SVG originales e ilustración raster con procedencia.
- `public/icons/` y metadata en `app/`: favicon, Apple/Android, PWA y social.
- `tests/` y `e2e/`: comportamiento crítico.
- `qa/`: capturas comparables de portada y ficha a 375, 768 y 1440 px.

## Limitaciones conocidas

- No existe bot automático de WhatsApp; se usa Web Share/copia y un resumen
  administrativo.
- El modo demo es intencionalmente efímero.
- La migración está preparada, pero los flujos Supabase reales requieren
  credenciales y un proyecto externo para validación end-to-end.
- La detección de duplicados advierte; nunca fusiona automáticamente.
