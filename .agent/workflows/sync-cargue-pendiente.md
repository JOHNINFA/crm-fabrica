---
description: Tareas pendientes para completar sincronización de Cargue en BD
---

# Sincronización de Cargue - Tareas Pendientes

## ✅ YA IMPLEMENTADO (Sesión 20 Dic 2025)

### Backend
- [x] Endpoint `/obtener-cargue/` devuelve TODOS los campos (nequi, daviplata, cumplimiento, lotes_vencidos)

### Frontend
- [x] `cargueApiService.js` - Parsea todos los campos nuevos
- [x] `cargueApiService.js` - Función `extraerYGuardarDatosGlobales`
- [x] `ResumenVentas.jsx` - Si localStorage vacío → Carga pagos desde BD (parcialmente)
- [x] `ControlCumplimiento.jsx` - Si localStorage vacío → Carga cumplimiento desde BD
- [x] `RegistroLotes.jsx` - Si localStorage vacío → Carga lotes desde BD
- [x] `BotonLimpiar.jsx` - Infiere estado desde BD (DESPACHO si checks V+D)
- [x] `PlantillaOperativa.jsx` - Debounce aumentado a 1500ms

---

## ❌ PENDIENTE

### 1. Tabla de Pagos Completa (CONCEPTO, DESCUENTOS, NEQUI, DAVIPLATA)

**Problema:** Actualmente se guardan los TOTALES en las tablas `CargueIDx`, pero la tabla de pagos tiene múltiples filas.

**Solución:**

#### 1.1 Crear endpoint para `CarguePagos`

Archivo: `/api/views.py`
```python
from rest_framework import viewsets
from .models import CarguePagos
from .serializers import CarguePagosSerializer

class CarguePagosViewSet(viewsets.ModelViewSet):
    queryset = CarguePagos.objects.all()
    serializer_class = CarguePagosSerializer
    filterset_fields = ['vendedor_id', 'dia', 'fecha']
```

#### 1.2 Registrar ruta en urls.py

Archivo: `/api/urls.py`
```python
router.register(r'cargue-pagos', CarguePagosViewSet)
```

#### 1.3 Modificar frontend `ResumenVentas.jsx`

- Al guardar: Eliminar registros anteriores y crear uno por cada fila con datos
- Al cargar: Consultar todos los registros y poblar las filas

---

### 2. Estado del Botón en BD

**Problema:** El estado del botón (ALISTAMIENTO, SUGERIDO, DESPACHO, COMPLETADO) solo está en localStorage.

**Solución:**

#### 2.1 Agregar campo a modelo `CargueResumen` o `CargueIDx`

```python
# En models.py, agregar a CargueResumen:
estado_cargue = models.CharField(
    max_length=20, 
    choices=[
        ('ALISTAMIENTO', 'Alistamiento'),
        ('SUGERIDO', 'Sugerido'),
        ('DESPACHO', 'Despacho'),
        ('COMPLETADO', 'Completado')
    ],
    default='ALISTAMIENTO'
)
```

#### 2.2 Crear migración
```bash
python3 manage.py makemigrations
python3 manage.py migrate
```

#### 2.3 Modificar frontend `BotonLimpiar.jsx`
- Al cambiar estado: Sincronizar con BD usando `cargueRealtimeService.actualizarCampoGlobal`
- Al cargar: Consultar el estado desde BD si localStorage está vacío

---

## Archivos modificados en esta sesión:

1. `/api/views.py` - Línea ~2583 (obtener_cargue más campos)
2. `/frontend/src/services/cargueApiService.js` - Parseo completo + extraerYGuardarDatosGlobales
3. `/frontend/src/components/Cargue/ResumenVentas.jsx` - Carga desde BD
4. `/frontend/src/components/Cargue/ControlCumplimiento.jsx` - Carga desde BD
5. `/frontend/src/components/Cargue/RegistroLotes.jsx` - Carga desde BD
6. `/frontend/src/components/Cargue/BotonLimpiar.jsx` - Inferencia de estado
7. `/frontend/src/components/Cargue/PlantillaOperativa.jsx` - Debounce 1500ms

---

## Para probar después:

1. Ejecutar servidor: `python3 manage.py runserver 0.0.0.0:8000`
2. Ejecutar frontend: `cd frontend && npm start`
3. Abrir en navegador normal y en modo incógnito
4. Verificar que los datos se cargan desde BD en incógnito

---

## Próximos pasos para Dockerizar:

1. Completar sincronización de pagos y estado
2. Probar funcionamiento completo
3. Crear Dockerfile y docker-compose.yml
