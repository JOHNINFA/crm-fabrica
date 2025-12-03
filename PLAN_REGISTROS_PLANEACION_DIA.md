# Plan: Tabla RegistrosPlaneacionDia

## Fecha de Creación: 2 de Diciembre 2025
## Estado: ✅ IMPLEMENTADO (Backend + Frontend)

---

## Problema Actual
- Cuando se modifica ADICIONAL o DCTOS en Cargue mientras está en ALISTAMIENTO ACTIVO, las SOLICITADAS en Planeación se actualizan dinámicamente.
- Intentar congelar Planeación directamente genera errores y borra datos.
- Se necesita un registro histórico de cómo estaba la planeación al momento de congelar.

---

## Solución Propuesta

### 1. Crear Nueva Tabla: `RegistrosPlaneacionDia`

**Ubicación:** `api/models.py`

**Campos:**
```python
class RegistrosPlaneacionDia(models.Model):
    fecha = models.DateField()  # Fecha del día de planeación
    producto_nombre = models.CharField(max_length=200)
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    fecha_congelado = models.DateTimeField(auto_now_add=True)  # Timestamp de cuándo se congeló
    usuario = models.CharField(max_length=100, default='Sistema')
    
    class Meta:
        db_table = 'api_registros_planeacion_dia'
        unique_together = ['fecha', 'producto_nombre']  # Un registro por producto por día
```

### 2. Crear Serializer y ViewSet

**Ubicación:** `api/serializers.py` y `api/views.py`

- Crear `RegistrosPlaneacionDiaSerializer`
- Crear `RegistrosPlaneacionDiaViewSet` con endpoints para:
  - GET: Consultar registros por fecha
  - POST: Guardar snapshot al congelar

### 3. Modificar BotonLimpiar.jsx

**Ubicación:** `frontend/src/components/Cargue/BotonLimpiar.jsx`

**Momento de guardado:** Cuando el botón cambia de SUGERIDO → ALISTAMIENTO_ACTIVO

**Función a crear:** `guardarSnapshotPlaneacion()`
- Obtener datos actuales de Planeación (existencias, solicitadas, pedidos, orden, ia)
- Enviar a la nueva API `/api/registros-planeacion-dia/`

### 4. Crear Reporte en Reportes Avanzados

**Ubicación:** Módulo "Otros" → "Reportes Avanzados" → "Reportes de Planeación"

**Funcionalidad:**
- Selector de fecha
- Tabla mostrando los datos congelados de ese día
- Comparación con datos actuales (opcional)

---

## Flujo de Trabajo

```
1. Usuario está en Cargue con botón "SUGERIDO"
2. Usuario hace clic en el botón
3. Sistema captura datos actuales de Planeación:
   - Consulta existencias desde api_stock
   - Consulta solicitadas desde tablas de cargue (ID1-ID6)
   - Consulta pedidos desde api_pedidos
   - Consulta orden e ia desde api_planeacion
4. Sistema envía snapshot a api_registros_planeacion_dia
5. Botón cambia a "ALISTAMIENTO ACTIVO"
6. Planeación sigue funcionando normal (dinámica)
7. Usuario puede consultar el snapshot desde Reportes Avanzados
```

---

## Archivos a Modificar/Crear

### Backend (Django)
1. `api/models.py` - Agregar modelo RegistrosPlaneacionDia
2. `api/serializers.py` - Agregar serializer
3. `api/views.py` - Agregar viewset
4. `api/urls.py` - Agregar ruta
5. Ejecutar: `python manage.py makemigrations` y `python manage.py migrate`

### Frontend (React)
1. `frontend/src/components/Cargue/BotonLimpiar.jsx` - Agregar función guardarSnapshotPlaneacion()
2. `frontend/src/components/Otros/ReportesAvanzados/` - Crear o modificar componente de reportes

---

## Beneficios
- ✅ Planeación sigue funcionando sin modificaciones (sin errores)
- ✅ Registro histórico de datos al momento de congelar
- ✅ Consulta desde Reportes Avanzados
- ✅ No afecta el flujo actual del sistema
- ✅ Datos congelados no se modifican aunque cambien los datos de cargue

---

## Notas Adicionales
- La tabla api_planeacion existente NO se modifica
- Los datos en RegistrosPlaneacionDia son inmutables (solo se crean, no se actualizan)
- Si se congela el mismo día dos veces, se sobrescribe el registro anterior (unique_together)

---

## Progreso de Implementación

### ✅ Completado (2 Dic 2025)
1. ✅ Modelo `RegistrosPlaneacionDia` creado en `api/models.py`
2. ✅ Migración ejecutada: `api/migrations/0051_registros_planeacion_dia.py`
3. ✅ Serializer creado en `api/serializers.py`
4. ✅ ViewSet creado en `api/views.py` con endpoints:
   - GET `/api/registros-planeacion-dia/` - Listar registros
   - GET `/api/registros-planeacion-dia/consultar_fecha/?fecha=YYYY-MM-DD` - Consultar por fecha
   - POST `/api/registros-planeacion-dia/guardar_snapshot/` - Guardar snapshot
5. ✅ Ruta registrada en `api/urls.py`
6. ✅ Función `guardarSnapshotPlaneacion()` agregada en `BotonLimpiar.jsx`
7. ✅ Llamada al snapshot integrada en cambio SUGERIDO → ALISTAMIENTO_ACTIVO
8. ✅ Reporte de Planeación modificado en `ReportesAvanzadosScreen.jsx` para consultar snapshots
9. ✅ Corregido cálculo de SOLICITADAS: `cantidad + adicional + dctos`

### ✅ IMPLEMENTACIÓN COMPLETA

---

## Cómo Funciona

### Guardado Automático
Cuando el usuario hace clic en **SUGERIDO** y cambia a **ALISTAMIENTO ACTIVO**:
1. Se ejecuta `guardarSnapshotPlaneacion()`
2. Captura: Existencias (stock), Solicitadas (cantidad+adicional+dctos de cargue), Pedidos
3. Guarda en tabla `api_registros_planeacion_dia`

### Consulta de Snapshots
- Ir a **Otros → Reportes Avanzados → Planeación de Producción**
- Seleccionar fecha y consultar
- Muestra los datos congelados al momento del cambio de estado

### API Endpoints
```
GET  /api/registros-planeacion-dia/?fecha=2025-09-27
GET  /api/registros-planeacion-dia/consultar_fecha/?fecha=2025-09-27
POST /api/registros-planeacion-dia/guardar_snapshot/
```
