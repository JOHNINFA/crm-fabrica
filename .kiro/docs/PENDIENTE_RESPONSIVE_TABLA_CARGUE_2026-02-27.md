# Pendiente: Responsive Tabla Cargue (Web)

Fecha: 2026-02-27  
Estado: Pendiente (pausado por prioridad APK AP Guerrero)

## Contexto
- En escritorio, Cargue funciona bien:
  - Header de tabla visible al hacer scroll.
  - Barra inferior de IDs visible/fija.
- En tablet (ej. iPad Air), no está funcionando como se espera:
  - Al hacer scroll, desaparecen títulos de tabla (`V, D, PRODUCTOS, ...`).
  - No se mantiene visible la barra de IDs en la parte inferior.
  - En intentos previos se alteró el estilo visual del header (no deseado).

## Requisitos obligatorios para el ajuste
- No romper ni cambiar estilos/flujo en desktop.
- Mantener exactamente el estilo actual del header (colores, bordes, tipografía).
- En tablet:
  - Header de tabla fijo durante scroll.
  - Barra de IDs fija y visible.
  - Scroll fluido y sin saltos.

## Criterios de aceptación
- Desktop: comportamiento y diseño igual al actual (sin regresiones).
- Tablet:
  - Header visible al inicio, durante scroll y al final.
  - Barra de IDs siempre visible en la parte inferior.
  - No cambios de color/fondo no solicitados.

## Nota operativa
- Este tema queda en pausa temporal por alerta prioritaria de APK AP Guerrero.
- Retomar después de cerrar revisión urgente de la APK.
