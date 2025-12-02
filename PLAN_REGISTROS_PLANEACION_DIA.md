# Plan: Tabla RegistrosPlaneacionDia

## Fecha de Creación: 2 de Diciembre 2025
## Estado: PENDIENTE DE IMPLEMENTAR

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

## Para Continuar Mañana
1. Leer este documento
2. Empezar por crear el modelo en api/models.py
3. Hacer migraciones
4. Crear serializer y viewset
5. Modificar BotonLimpiar.jsx
6. Crear/modificar reporte en Reportes Avanzados
