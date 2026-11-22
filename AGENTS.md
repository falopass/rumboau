# Rumbo AU — contrato para agentes

## Qué es
Tablero comunitario público de postulaciones **Working Holiday Australia**. No pertenece al Gobierno de Australia, no entrega asesoría migratoria y no predice resoluciones. Estado: en producción (Vercel), con trabajo local sin commitear.

## Stack y versiones
Next.js, Supabase (RLS + políticas), Playwright para e2e.

## Comandos
```
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Despliegue
**Vercel** (`.vercel/` presente). No hay script de deploy en `package.json`: el despliegue va por la integración de Vercel, no por comando. Remoto `github.com/falopass/rumboau`, rama `main`.

## Mapa
- `app/`, `components/`, `lib/` — producto
- `supabase/` — esquema, políticas y migraciones
- `tests/`, `e2e/`, `qa/` — pruebas y QA
- `DESIGN.md` — contrato visual vigente
- `.env.example` — variables esperadas (nunca leer `.env.local`)

## Reglas que no se rompen
- El promedio de espera resume **solo registros comunitarios `granted` con fecha**; nunca se presenta como plazo oficial.
- Se recopila móvil chileno para verificación manual, pero la vista pública solo muestra la versión enmascarada. **No se suben documentos.**
- Toda mutación y toda vista administrativa exigen autorización server-side. Preservar RLS, separación público/privado, rate limits, auditoría y tokens de recuperación de un solo uso.
- `noindex` y robots cerrado son **decisiones de privacidad**, no SEO técnico. Cambiarlos requiere aprobación explícita y renovación de consentimiento.
- El modo demo es desarrollo efímero: no debe filtrarse a producción ni confundirse con datos reales.
- `DESIGN.md` y la UI actual son el contrato de mantenimiento presente, no una aprobación perpetua. Un rediseño explícito puede evolucionar el contrato, nunca debilitar privacidad, consentimientos, `noindex` ni accesibilidad.
- `frontend-base` es la única guía para el tablero y los flujos de producto; `DESIGN.md` conserva la identidad y la dirección local.
- Piso comprobable antes de entregar: `C:/Users/lenov/.agents/studio/canonical/frontend-references/corpus/piso.md` (16 reglas; vale con cualquier dirección). Referencias por tema en `corpus/LEEME.md`; aquí sirven `interfaz-producto.md`, `dataviz.md`, `accesibilidad-responsive.md`. Rutas de la máquina de Diego.

## Verificación
Sin checks por defecto: releer el cambio y terminar. Builds, Playwright y navegador solo por petición o riesgo concreto que no se resuelva por lectura. Consultas Supabase, migraciones e instalaciones conservan su autorización y nunca exponen secretos.

## Estado
Verificado 2026-11-08: rama `main`, HEAD `897d481` (2026-07-30), **7 commits detrás de `origin`** y 30 ficheros sin commitear. Antes de dar por bueno cualquier supuesto sobre el código, sincronizar.
