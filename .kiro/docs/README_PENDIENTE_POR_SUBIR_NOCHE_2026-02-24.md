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

### Documentacion (opcional pero recomendado)
- `.kiro/docs/ULTIMO_TRABAJO_CARGUE.md`
- `.kiro/docs/MODAL_AUDITORIA_LIQUIDACION.md`
- `.kiro/docs/SEGUIMIENTO_SEGURIDAD_AP_GUERRERO_2026-02-23.md`
- `.kiro/docs/TRABAJOS_REALIZADOS_AP_GUERRERO_2026-02-17.md`

## No subir (ruido)
- `api/__pycache__/models.cpython-310.pyc`
- `api/__pycache__/serializers.cpython-310.pyc`
- `api/__pycache__/views.cpython-310.pyc`
- `frontend/src/components/Cargue/MenuSheets.jsx` (solo espacios, revisar antes)
- `.kiro/steering/rag-context.md` (borrado, confirmar si fue intencional)

## Plan de subida nocturna (orden recomendado)

1. Confirmar APK nueva distribuida en todos los IDs.
2. Hacer backup de BD en VPS.
3. Hacer commit/push local solo de archivos pendientes utiles.
4. En VPS:
   - `git pull origin main`
   - `docker exec crm_backend_prod python manage.py migrate`
   - `docker compose -f docker-compose.prod.yml up -d --build backend`
   - `docker compose -f docker-compose.prod.yml up -d --build frontend`
5. Pruebas de humo:
   - App: login, sugeridos, cargue, ventas ruta, cierre de turno.
   - Web: herramientas/sesiones moviles, ventas ruta, pedidos.

## Checklist de validacion APK nueva
- Puede iniciar sesion.
- Puede enviar sugeridos.
- Puede revisar cargue del dia.
- Puede vender y sincronizar (online/offline).
- Reimpresion de ticket funciona.

## Nota operativa
Mientras no se despliegue backend con reglas estrictas nuevas, conviven APK vieja y APK nueva.  
El corte de compatibilidad debe hacerse solo despues de confirmar que todos actualizaron.

---

## Actualizacion Operativa - 2026-02-27 (ID5, ventas pendientes)

### Hallazgo en produccion (2026-02-26)
- En VPS se observaron multiples `POST /api/ventas-ruta/` con `400`.
- En `SyncLog` para `ID5` quedaron reintentos sobre los mismos `id_local` con error:
  - `foto_vencidos`: "La informacion enviada no era un archivo..."
- Impacto: ventas pendientes en barra naranja y diferencia entre total de Cargue vs `Ventas Ruta`.

### Decision de despliegue (transicion segura)
1. **No aplicar aun el corte completo de compatibilidad** (`0090-0094` + endurecimiento total) mientras existan APK antiguas en calle.
2. Aplicar **hotfix transitorio** compatible (backend) para que no se caigan ventas por `foto_vencidos` mal serializado:
   - Si `foto_vencidos` llega invalido/no archivo en flujo legacy, no bloquear la venta.
   - Mantener registro de `productos_vencidos` y permitir sincronizacion.
3. Cuando todos tengan APK nueva (Expo build actual), ejecutar despliegue final nocturno con migraciones y reglas completas.

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
