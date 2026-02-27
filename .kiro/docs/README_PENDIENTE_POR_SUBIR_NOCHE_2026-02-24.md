# README Pendiente Por Subir (Noche)

Fecha: 2026-02-24
Proyecto: CRM Fabrica / AP Guerrero

## Objetivo
Subir en la noche los cambios pendientes de backend + migraciones + seguridad, cuando todos los vendedores ya tengan la APK nueva.

## Cambios pendientes detectados

### Backend (pendiente)
- `api/models.py`
- `api/serializers.py`
- `api/views.py`
- `api/services/rag_context_loader.py`
- `api/migrations/0090_add_editada_to_venta_ruta.py`
- `api/migrations/0091_add_estado_to_ventaruta.py`
- `api/migrations/0092_pedido_productos_vencidos.py`
- `api/migrations/0093_vendedorsesiontoken.py`
- `api/migrations/0094_rutaordenvendedor.py`

### Frontend web relacionado con backend (pendiente)
- `frontend/src/components/common/Herramientas.jsx`

## Plan de subida nocturna (orden recomendado)
1. Confirmar APK nueva distribuida en todos los IDs.
2. Hacer backup de BD en VPS.
3. Hacer commit/push local solo de archivos pendientes útiles.
4. En VPS:
   - `git pull origin main`
   - `docker compose -f docker-compose.prod.yml up -d --build backend`
   - `docker exec -i crm_backend_prod python manage.py migrate`
   - `docker compose -f docker-compose.prod.yml up -d --build frontend`
5. Pruebas de humo:
   - App: login, sugeridos, cargue, ventas ruta, cierre de turno.
   - Web: herramientas/sesiones móviles, ventas ruta, pedidos.

## Nota operativa
Mientras no se despliegue backend con reglas estrictas nuevas, conviven APK vieja y APK nueva.
El corte de compatibilidad debe hacerse solo después de confirmar que todos actualizaron.

---

## Actualización operativa - 2026-02-27

### Incidente detectado (ID5)
- En VPS se observaron múltiples `POST /api/ventas-ruta/` con `400`.
- En `SyncLog` se repitió el error de validación de `foto_vencidos` en reintentos offline.
- Resultado: ventas pendientes pegadas en barra naranja y diferencias entre Cargue vs Ventas Ruta.

### Medida transitoria aplicada
- Se aplica un hotfix backend compatible con APK vieja:
  - si `foto_vencidos` llega en formato legacy/no archivo, se ignora la foto inválida;
  - la venta sí se guarda para no bloquear sincronización.
- Este hotfix no aplica migraciones de corte (`0090-0094`) todavía.

### Fase 1 (ahora, para estabilizar operacion de manana)
- Deploy de hotfix transitorio (sin migraciones nuevas de corte).
- Validar en ID5:
  - desaparecen pendientes pegadas,
  - suben ventas de ruta,
  - se reduce discrepancia con cargue.

### Fase 2 (noche, despues de confirmar APK nueva en todos)
- Ejecutar plan completo de este documento:
  - subir backend pendiente + migraciones `0090` a `0094`,
  - rebuild backend/frontend,
  - `manage.py migrate`,
  - pruebas de humo completas.

### Criterio de corte final
- Solo ejecutar Fase 2 cuando se confirme:
  - APK nueva instalada en todos los IDs,
  - login/token operativo en todos los equipos,
  - no quedan equipos activos con APK legacy.

### Bitacora de ejecucion real (2026-02-27 madrugada)
- Se detecto que un commit amplio (`7fab481`) incluia cambios adicionales no deseados para produccion.
- Se revirtio en remoto con `4e736c2` para volver a estado seguro.
- Se publico hotfix minimo `9bb23ce` (solo tolerancia de `foto_vencidos` legacy en `POST /api/ventas-ruta/` + documentacion).
- En VPS:
  - `git pull --rebase origin main` (quedo en `9bb23ce`),
  - `docker compose -f docker-compose.prod.yml up -d --build backend`,
  - backend levantado OK, sin migraciones nuevas aplicadas (sigue hasta `0089`).
- Validacion operativa reportada:
  - pruebas de ventas offline/online exitosas (5 ventas sincronizadas),
  - pendientes se enviaron al reconectar internet.
- Observacion de impresion:
  - primer ticket offline sin logo/titulo completo,
  - siguientes tickets correctos tras reconexion; probable cache de configuracion de impresion.
