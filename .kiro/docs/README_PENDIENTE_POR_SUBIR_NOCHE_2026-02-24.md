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

### Corte final (noche)
- Cuando todos los vendedores ya tengan APK nueva:
  - desplegar backend pendiente completo,
  - aplicar migraciones `0090-0094`,
  - activar reglas definitivas de seguridad/sesión.
