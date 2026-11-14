# Rumbo AU â€” contrato para agentes

## QuÃ© es
Tablero comunitario pÃºblico de postulaciones **Working Holiday Australia**. No pertenece al Gobierno de Australia, no entrega asesorÃ­a migratoria y no predice resoluciones. Estado: en producciÃ³n (Vercel), con trabajo local sin commitear.

## Stack y versiones
Next.js, Supabase (RLS + polÃ­ticas), Playwright para e2e.

## Comandos
```
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Despliegue
**Vercel** (`.vercel/` presente). No hay script de deploy en `package.json`: el despliegue va por la integraciÃ³n de Vercel, no por comando. Remoto `github.com/falopass/rumboau`, rama `main`.

## Mapa
- `app/`, `components/`, `lib/` â€” producto
- `supabase/` â€” esquema, polÃ­ticas y migraciones
- `tests/`, `e2e/`, `qa/` â€” pruebas y QA
- `DESIGN.md` â€” contrato visual vigente
- `.env.example` â€” variables esperadas (nunca leer `.env.local`)

## Reglas que no se rompen
- El promedio de espera resume **solo registros comunitarios `granted` con fecha**; nunca se presenta como plazo oficial.
- Se recopila mÃ³vil chileno para verificaciÃ³n manual, pero la vista pÃºblica solo muestra la versiÃ³n enmascarada. **No se suben documentos.**
- Toda mutaciÃ³n y toda vista administrativa exigen autorizaciÃ³n server-side. Preservar RLS, separaciÃ³n pÃºblico/privado, rate limits, auditorÃ­a y tokens de recuperaciÃ³n de un solo uso.
- `noindex` y robots cerrado son **decisiones de privacidad**, no SEO tÃ©cnico. Cambiarlos requiere aprobaciÃ³n explÃ­cita y renovaciÃ³n de consentimiento.
- El modo demo es desarrollo efÃ­mero: no debe filtrarse a producciÃ³n ni confundirse con datos reales.
- `DESIGN.md` y la UI actual son el contrato de mantenimiento presente, no una aprobaciÃ³n perpetua. Un rediseÃ±o explÃ­cito puede evolucionar el contrato, nunca debilitar privacidad, consentimientos, `noindex` ni accesibilidad.
- `interface-design` dirige el tablero y los flujos de producto; `frontend-director` solo interviene en identidad o crÃ­tica difÃ­cil.
- Base operativa: `frontend-base` (direcciÃ³n por proyecto, entrada por secciÃ³n, textura).
- Piso comprobable antes de entregar: `C:/Users/lenov/.agents/studio/canonical/frontend-references/corpus/piso.md` (16 reglas; vale con cualquier direcciÃ³n). Referencias por tema en `corpus/LEEME.md`; aquÃ­ sirven `interfaz-producto.md`, `dataviz.md`, `accesibilidad-responsive.md`. Rutas de la mÃ¡quina de Diego.

## VerificaciÃ³n
Sin checks por defecto: releer el cambio y terminar. Builds, Playwright y navegador solo por peticiÃ³n o riesgo concreto que no se resuelva por lectura. Consultas Supabase, migraciones e instalaciones conservan su autorizaciÃ³n y nunca exponen secretos.

## Estado
Verificado 2026-11-08: rama `main`, HEAD `897d481` (2026-07-30), **7 commits detrÃ¡s de `origin`** y 30 ficheros sin commitear. Antes de dar por bueno cualquier supuesto sobre el cÃ³digo, sincronizar.
