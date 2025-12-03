# 🔍 Análisis de Impacto: Normalización de Base de Datos

## 📱 MÓDULOS QUE CONSULTAN `api_cargueid1` (y similares)

### 1. **App Móvil (AP GUERRERO)**

#### Endpoints usados:
- **`/api/obtener-cargue/`** (GET) - La app descarga datos
- **`/api/guardar_sugerido/`** (POST) - La app envía datos

#### Campos que consulta la App:
```python
# En obtener_cargue():
data[producto] = {
    'quantity': reg.total,
    'cantidad': reg.cantidad,
    'adicional': reg.adicional,
    'dctos': reg.dctos,
    'v': reg.v,  # Check vendedor
    'd': reg.d   # Check despachador
}
```

#### ✅ **IMPACTO: NINGUNO**
- La App solo lee campos de **PRODUCTOS** (cantidad, total, v, d)
- **NO** lee campos de resumen (base_caja, total_despacho, etc.)
- **NO** lee campos de cumplimiento (licencia_transporte, etc.)

**Conclusión:** La App seguirá funcionando igual porque solo accede a la tabla de productos.

---

### 2. **Frontend Web (CRM)**

#### Endpoints usados:
- **`/api/cargue-id1/`** (GET, POST, PATCH, DELETE)
- ViewSet completo con filtros por `dia`, `fecha`, `producto`

#### Campos que consulta:
- **Productos:** cantidad, dctos, adicional, devoluciones, vencidas, total, neto, v, d
- **Resumen:** base_caja, total_despacho, total_pedidos, venta, total_efectivo
- **Pagos:** concepto, descuentos, nequi, daviplata
- **Cumplimiento:** licencia_transporte, soat, uniforme, etc.

#### ⚠️ **IMPACTO: REQUIERE ADAPTACIÓN**
El frontend actualmente hace consultas como:
```javascript
// Obtener todos los datos de un día:
fetch('/api/cargue-id1/?dia=SABADO&fecha=2025-10-25')
// Devuelve: 50 filas con TODOS los campos mezclados
```

**Solución:**
Crear un **endpoint unificado** que devuelva todo:
```python
@api_view(['GET'])
def obtener_cargue_completo(request):
    # Consulta productos
    productos = CargueProductos.objects.filter(...)
    
    # Consulta resumen (1 fila)
    resumen = CargueResumen.objects.get(...)
    
    # Consulta pagos
    pagos = CarguePagos.objects.filter(...)
    
    # Consulta cumplimiento
    cumplimiento = CargueCumplimiento.objects.get(...)
    
    # Combina todo y devuelve en el MISMO formato que antes
    return Response(data)
```

**Frontend NO necesita cambios** porque el endpoint devuelve el mismo formato.

---

### 3. **Servicio de IA (ia_service.py)**

#### Uso:
```python
from api.models import CargueID1, CargueID2, ...

for modelo in [CargueID1, CargueID2, ...]:
    registros = modelo.objects.filter(fecha=fecha_objetivo, dia=dia)
    # Analiza productos y genera recomendaciones
```

#### Campos que consulta:
- **Solo productos:** producto, cantidad, total

#### ✅ **IMPACTO: MÍNIMO**
Solo necesita leer la tabla de productos (que se mantiene).

**Cambio necesario:**
```python
# ANTES:
registros = CargueID1.objects.filter(...)

# DESPUÉS:
registros = CargueProductos.objects.filter(vendedor_id='ID1', ...)
```

---

### 4. **Planeación (PlaneacionSerializer)**

#### Uso:
Al finalizar cargue, actualiza inventario basado en totales:
```python
# En DetallePedidoSerializer.Meta.update_inventarios_desde_cargue()
for vendedor_id, Modelo in [('ID1', CargueID1), ...]:
    cargue_registros = Modelo.objects.filter(fecha=pedido_fecha, dia=dia_semana)
    for registro in cargue_registros:
        producto_nombre = registro.producto
        total_despachado = registro.total  # Usa el campo 'total'
        # Actualiza inventario
```

#### Campos que consulta:
- **Solo productos:** producto, total

#### ✅ **IMPACTO: MÍNIMO**
Solo lee productos.

**Cambio necesario:**
```python
# ANTES:
cargue_registros = CargueID1.objects.filter(...)

# DESPUÉS:
cargue_registros = CargueProductos.objects.filter(vendedor_id='ID1', ...)
```

---

### 5. **Sincronización desde Planeación**

#### Uso:
Cuando se actualiza un pedido en Planeación, sincroniza con Cargue:
```python
# En api/views.py - actualizar_producto_planeacion()
modelos = {'ID1': CargueID1, ...}
Modelo = modelos.get(vendedor_id)
registro_cargue = Modelo.objects.filter(...).first()
if registro_cargue:
    registro_cargue.cantidad = nueva_cantidad
    registro_cargue.save()
```

#### Campos que modifica:
- **Solo productos:** cantidad, total

#### ✅ **IMPACTO: MÍNIMO**
Solo escribe en productos.

**Cambio necesario:**
```python
# ANTES:
registro_cargue = CargueID1.objects.filter(...)

# DESPUÉS:
registro_cargue = CargueProductos.objects.filter(vendedor_id='ID1', ...)
```

---

## 📊 RESUMEN DE IMPACTO POR MÓDULO

| Módulo | Impacto | Cambios Necesarios | Complejidad |
|--------|---------|-------------------|-------------|
| **App Móvil** | ✅ Ninguno | 0 líneas | N/A |
| **Frontend Web** | ⚠️ Medio | Crear endpoint unificado | Baja |
| **Servicio IA** | ✅ Mínimo | 5 líneas | Muy Baja |
| **Planeación** | ✅ Mínimo | 10 líneas | Muy Baja |
| **Sincronización** | ✅ Mínimo | 10 líneas | Muy Baja |
| **Admin Django** | ⚠️ Medio | Registrar nuevas tablas | Muy Baja |

---

## 🛠️ ESTRATEGIA DE MIGRACIÓN SIN ROMPER NADA

### Opción 1: **Migración Transparent (Recomendada)**

**Idea:** Mantener ambas estructuras temporalmente.

1. **Crear nuevas tablas** (CargueProductos, CargueResumen, etc.)
2. **Crear vista SQL** que emule la tabla antigua:
   ```sql
   CREATE VIEW api_cargueid1 AS
   SELECT 
       p.*,
       r.base_caja, r.total_despacho, r.total_pedidos,
       pag.concepto, pag.descuentos,
       c.licencia_transporte, c.soat
   FROM api_cargue_productos p
   LEFT JOIN api_cargue_resumen r ON (p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha)
   LEFT JOIN api_cargue_pagos pag ON (p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha)
   LEFT JOIN api_cargue_cumplimiento c ON (p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha);
   ```

3. **Código existente NO toca nada** porque sigue viendo `api_cargueid1`
4. **Código nuevo** usa las tablas normalizadas
5. **Eventualmente** se migra todo y se elimina la vista

**Ventajas:**
- ✅ **Cero riesgo** de romper nada
- ✅ Migración gradual
- ✅ Fácil rollback

---

### Opción 2: **Migración Directa (Más rápida)**

1. **Crear nuevas tablas**
2. **Migrar datos** con script
3. **Renombrar tabla antigua** a `api_cargueid1_deprecated`
4. **Actualizar todo el código** de una vez
5. **Probar exhaustivamente**
6. **Eliminar tabla antigua** cuando todo funcione

**Ventajas:**
- ✅ Más limpio
- ✅ Termina más rápido

**Desventajas:**
- ⚠️ Requiere probar TODO antes de deploy

---

## ✅ RECOMENDACIÓN FINAL

**Plan de 3 Fases:**

### Fase 1: Crear Tablas Paralelas (1 día)
- Crear modelos: `CargueProductos`, `CargueResumen`, `CargueP agos`, `CargueCumplimiento`
- Crear vista SQL que emule la tabla antigua
- Migrar datos existentes a nuevas tablas
- Probar que la vista devuelve los mismos datos

### Fase 2: Migrar Código Crítico (1 día)
- Actualizar endpoints del frontend para usar nuevas tablas
- Actualizar endpoint `obtener_cargue` (App Móvil) si es necesario
- Actualizar `guardar_sugerido` (App Móvil) si es necesario
- Actualizar servicio de IA
- Probar TODO exhaustivamente

### Fase 3: Limpieza (1 hora)
- Eliminar vista SQL temporal
- Eliminar tabla antigua `api_cargueid1`
- Documentar nueva estructura

---

## ⚠️ CONCLUSIÓN

**¿Afectará a otros módulos?**
- App Móvil: **NO**
- Inventario: **NO** (no consulta directamente)
- Planeación: **SÍ**, pero cambio mínimo (10 líneas)
- Frontend: **SÍ**, pero sin cambios visuales (solo backend)

**¿Vale la pena?**
- **SÍ**, porque elimina 90% de redundancia y previene futuros problemas

**¿Es seguro?**
- **SÍ**, con la estrategia de migración correcta (vistas SQL temporales)
