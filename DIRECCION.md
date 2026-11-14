---
version: alpha
name: WH-Australia
colors:
  primary: "#14323B"
  secondary: "#4C6268"
  tertiary: "#E0B642"
  neutral: "#F2EBDD"
  surface: "#FBF7EF"
  on-primary: "#FBF7EF"
  on-tertiary: "#14323B"
typography:
  display:
    fontFamily: Archivo Variable
    fontSize: 3rem
    fontWeight: 690
    lineHeight: 0.94
    letterSpacing: -0.065em
  body-md:
    fontFamily: Archivo Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: DM Mono
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.12em
  button:
    fontFamily: Archivo Variable
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.5
rounded:
  sm: 6px
  md: 7px
  full: 999px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 14px
    typography: "{typography.button}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 14px
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 24px
  nav-link:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
  demo-banner:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    padding: 8px
---

## Overview

**Estado: borrador vivo.** Este fichero describe lo que hay hoy en `WH-Australia`, no un diseño cerrado. **Nada es final**: paleta, tipografía, composición y movimiento se pueden cambiar en el próximo encargo. Su única función es que el agente no invente y que la próxima sesión sepa de dónde parte.

**Concepto:** Cartografía editorial de una espera compartida.
**Ancla:** el registro comunitario de postulaciones Working Holiday entre Chile y Australia.
**Portabilidad:** no medida; la identidad vive en el repositorio, no en el nombre.

Papel, tinta, tinta suave y sol medidos de `--paper`, `--ink`, `--ink-soft` y `--sun` en `app/globals.css`.

## Colors

Los tokens salen del código existente, no de una propuesta. Se mantienen mientras no haya un rediseño autorizado; entonces se reescriben aquí primero.

## Typography

Display y texto `Archivo Variable`, etiquetas `DM Mono`, servidas con `@fontsource` desde `app/layout.tsx`; las variables `--font-interface` y `--font-mono` viven en `app/globals.css`. Si una familia no está instalada, se sustituye por la más cercana y se anota.

## Layout

Ancho de contenido y ritmo de espaciado sin cerrar: el repositorio manda. Familias de sección y agrupación en scroll se deciden por encargo, no aquí.

## Elevation & Depth

Sin sistema de sombras declarado. La profundidad la dan el color y el filete.

## Shapes

Radios `6px` en tarjetas y `7px` en botones; `999px` en píldoras y estados.

## Components

Botón primario, botón secundario, tarjeta de superficie, enlace de navegación y aviso demo. Los que existan en el código mandan sobre esta lista.

## Do's and Don'ts

- **Sí:** conservar los tokens y la identidad que ya están en el repositorio.
- **No:** cambiar paleta, tipografía o composición sin un encargo explícito.
- **Nunca:** inventar datos, testimonios, precios ni cifras; usar marcas o copy de terceros.

## Decisiones abiertas

- **Todo el diseño es revisable.** No hay ninguna decisión cerrada por este documento.
- La dirección artística por proyecto (concepto, ancla, momento firma) se declarará al rediseñar, no antes.
- Los valores marcados como medidos se confirman al abrir el sitio.

## Implementation Starting Point

Next.js 16 App Router con Supabase; `DESIGN.md` es el sistema visual.

`npm run dev` solo por petición; sin build por rutina.

## Agent Prompt

Lee este fichero y `AGENTS.md` antes de tocar frontend. Respeta los tokens mientras no haya encargo de rediseño; si lo hay, actualiza este documento primero y pasa `npx -p @google/design.md designmd lint DIRECCION.md` con 0 errores. Verifica 390 px, contraste y `prefers-reduced-motion`.

## Piso comprobado (opcional)

Reglas de `C:/Users/lenov/.agents/studio/canonical/frontend-references/corpus/piso.md`. Marca solo lo comprobado; anota cómo. Sin comprobar a la fecha 2026-11-13.

- [ ] 1 Movimiento reducido con estado final, también en JS
- [ ] 2 Nada nace invisible esperando a un script
- [ ] 3-4 Contraste por par real, grises secundarios incluidos, en ambos temas
- [ ] 5 Foco visible a 3:1
- [ ] 6 Salto, `<main>`, un `<h1>`, controles nativos, ids únicos
- [ ] 7 Formularios: label, validación al salir, `aria-disabled`
- [ ] 8-9 Imágenes con caja, `srcset` y `alt`; vídeo con `poster` y `preload`
- [ ] 10-12 Bucles con un reloj; pausa > 5 s; sin `transition: all`
- [ ] 13-14 Zoom 200 %, reflujo 320 px, objetivo 24 px
- [ ] 15-16 Cifras con fuente; `integrity`, `noopener`, `try/catch`, respaldo de `backdrop-filter`

## Límites declarados (opcional)

Aquí va lo no medido o no comprobado, dicho como tal: motion no visto en ejecución, tema secundario sin abrir, anchos sin probar, recetas del corpus usadas sin compilar.
