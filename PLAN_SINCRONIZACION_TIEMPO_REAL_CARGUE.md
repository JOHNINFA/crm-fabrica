# Plan: Sincronización en Tiempo Real - Módulo Cargue

## Fecha de Creación: 2 de Diciembre 2025
## Estado: PENDIENTE DE IMPLEMENTAR

---

## Problema Actual

1. Los datos se guardan principalmente en localStorage durante el trabajo
2. Solo se sincronizan con BD al final del flujo o con debounce de 3 segundos
3. Si el navegador falla o se cambia de equipo → Se pierde la información
4. No hay CRUD en tiempo real por campo

---

## Objetivo

Implementar sincronización en tiempo real donde cada cambio en un campo se guarde inmediatamente en la BD, manteniendo localStorage como cache para velocidad.

---

## Análisis de Campos por Origen

### Campos que vienen de App Móvil (NO tocar desde web)
| Campo | Endpoint | Descripción |
|-------|----------|-------------|
| `cantidad` | `guardar_sugerido` | Cantidad inicial del cargue |
| `v` | `actualizar_check_vendedor` | Checkbox vendedor |

### Campos que se editan desde Web (SINCRONIZAR)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `d` | checkbox | Despachador |
| `adicional` | número | Adicional |
| `dctos` | número | Descuentos |
| `devoluciones` | número | Devoluciones |
| `vencidas` | número | Vencidas |
| `lotes_vencidos` | JSON | Lotes con motivo |

### Campos globales por ID (SINCRONIZAR)
| Campo | Tipo |
|-------|------|
| `licencia_transporte` | C/NC |
| `soat` | C/NC |
| `uniforme` | C/NC |
| `no_locion` | C/NC |
| `no_accesorios` | C/NC |
| `capacitacion_carnet` | C/NC |
| `higiene` | C/NC |
| `estibas` | C/NC |
| `desinfeccion` | C/NC |
| `lotes_produccion` | JSON |
| `concepto` | texto |
| `descuentos` | número |
| `nequi` | número |
| `daviplata` | número |
| `base_caja` | número |

---

## Flujo por Estado del Botón

### Estado: SUGERIDO
- App móvil envía `cantidad` y `v` → Crea registros en BD
- Web puede ver datos pero campos limitados
- Campos editables web: `adicional`, `dctos`
- **Si producto no tiene registro → Se crea al editar**

### Estado: ALISTAMIENTO_ACTIVO
- Campos editables: `d`, `adicional`, `dctos`, `devoluciones`, `vencidas`, `lotes_vencidos`
- Control de cumplimiento editable
- Pagos editables
- **Cada cambio → Buscar registro → Si existe PATCH, si no POST**
- **Si producto no tiene registro → Se crea al editar**

### Estado: FINALIZAR
- Campos en solo lectura (inventario ya afectado)
- Solo se puede avanzar a COMPLETADO

### Estado: COMPLETADO
- Todo bloqueado
- **NO vuelve a guardar en BD** (ya está todo guardado en tiempo real)
- Solo limpia localStorage

---

## Lógica de Crear/Actualizar Registro

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario edita campo (ej: adicional = 5 en AREPA MEDIANA)   │
│           ↓                                                  │
│  Buscar: ¿Existe registro para este producto/fecha/dia?     │
│           ↓                                                  │
│  ┌─────────────┐              ┌─────────────┐               │
│  │  SÍ EXISTE  │              │  NO EXISTE  │               │
│  │     ↓       │              │      ↓      │               │
│  │   PATCH     │              │    POST     │               │
│  │ { adicional │              │ { dia,      │               │
│  │   : 5 }     │              │   fecha,    │               │
│  │             │              │   producto, │               │
│  │             │              │   adicional │               │
│  │             │              │   : 5 }     │               │
│  └─────────────┘              └─────────────┘               │
│           ↓                          ↓                       │
│        Registro actualizado    Registro creado               │
│           ↓                          ↓                       │
│        Actualizar localStorage (cache)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario edita campo (ej: adicional = 5)                    │
│           ↓                                                  │
│  1. Actualizar estado local (React state)                   │
│  2. Guardar en localStorage (cache rápido)                  │
│  3. PATCH a BD: /api/cargue-id1/{id}/ { adicional: 5 }     │
│           ↓                                                  │
│  Si PATCH exitoso → Continuar normal                        │
│  Si PATCH falla → Marcar como "pendiente de sync"           │
│           ↓                                                  │
│  Al reconectar → Reintentar sincronización                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementación Técnica

### 1. Backend - Nuevo Endpoint PATCH

**Archivo:** `api/views.py`

Agregar acción `actualizar_campo` en cada ViewSet de CargueIDX:

```python
@action(detail=True, methods=['patch'])
def actualizar_campo(self, request, pk=None):
    """
    Actualiza un campo específico de un registro de cargue.
    PATCH /api/cargue-id1/{id}/actualizar_campo/
    Body: { "campo": "adicional", "valor": 5 }
    """
    registro = self.get_object()
    campo = request.data.get('campo')
    valor = request.data.get('valor')
    
    campos_permitidos = [
        'd', 'adicional', 'dctos', 'devoluciones', 'vencidas',
        'lotes_vencidos', 'lotes_produccion',
        'licencia_transporte', 'soat', 'uniforme', 'no_locion',
        'no_accesorios', 'capacitacion_carnet', 'higiene', 'estibas', 'desinfeccion',
        'concepto', 'descuentos', 'nequi', 'daviplata', 'base_caja'
    ]
    
    if campo not in campos_permitidos:
        return Response({'error': f'Campo no permitido: {campo}'}, status=400)
    
    setattr(registro, campo, valor)
    registro.save()
    
    return Response({'success': True, 'campo': campo, 'valor': valor})
```

### 2. Frontend - Servicio de Sincronización

**Archivo:** `frontend/src/services/cargueRealtimeService.js` (NUEVO)

```javascript
// Servicio para sincronización en tiempo real
export const cargueRealtimeService = {
  
  // Actualizar o crear campo individual
  actualizarCampo: async (idSheet, dia, fecha, productoNombre, campo, valor, productoId, valorPrecio) => {
    const endpoint = `cargue-${idSheet.toLowerCase()}`;
    
    // 1. Buscar si existe registro
    const searchResponse = await fetch(
      `http://localhost:8000/api/${endpoint}/?fecha=${fecha}&producto=${encodeURIComponent(productoNombre)}`
    );
    const registros = await searchResponse.json();
    
    if (registros.length > 0) {
      // 2A. EXISTE → PATCH (actualizar)
      const registroId = registros[0].id;
      const response = await fetch(
        `http://localhost:8000/api/${endpoint}/${registroId}/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [campo]: valor })
        }
      );
      return { success: response.ok, action: 'updated', id: registroId };
    } else {
      // 2B. NO EXISTE → POST (crear)
      const nuevoRegistro = {
        dia: dia,
        fecha: fecha,
        producto: productoNombre,
        [campo]: valor,
        valor: valorPrecio || 0,
        responsable: 'Sistema'
      };
      const response = await fetch(
        `http://localhost:8000/api/${endpoint}/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoRegistro)
        }
      );
      const data = await response.json();
      return { success: response.ok, action: 'created', id: data.id };
    }
  },
  
  // Obtener registro existente
  obtenerRegistro: async (idSheet, fecha, productoNombre) => {
    const endpoint = `cargue-${idSheet.toLowerCase()}`;
    const response = await fetch(
      `http://localhost:8000/api/${endpoint}/?fecha=${fecha}&producto=${encodeURIComponent(productoNombre)}`
    );
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  }
};
```

### 3. Frontend - Modificar PlantillaOperativa.jsx

**Cambios necesarios:**

1. Importar `cargueRealtimeService`
2. En `actualizarProducto()`:
   - Después de actualizar estado local
   - Llamar a `cargueRealtimeService.actualizarCampo()`
3. En checkboxes:
   - Al cambiar `d` → Sincronizar inmediatamente
4. Mantener localStorage como backup

### 4. Frontend - Modificar BotonLimpiar.jsx

**Cambios en estado COMPLETADO:**

```javascript
case 'COMPLETADO':
  // NO guardar en BD (ya está todo sincronizado)
  // Solo limpiar localStorage
  localStorage.removeItem(`cargue_${dia}_${idSheet}_${fecha}`);
  localStorage.removeItem(`estado_boton_${dia}_${fecha}`);
  // etc...
```

---

## Archivos a Modificar

### Backend
1. `api/views.py` - Agregar endpoint PATCH para cada CargueIDXViewSet

### Frontend
1. `frontend/src/services/cargueRealtimeService.js` - CREAR servicio nuevo
2. `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Integrar sincronización
3. `frontend/src/components/Cargue/BotonLimpiar.jsx` - Ajustar lógica de COMPLETADO
4. `frontend/src/components/Cargue/ControlCumplimiento.jsx` - Sincronizar campos
5. `frontend/src/components/Cargue/RegistroLotes.jsx` - Sincronizar lotes

---

## Consideraciones Importantes

### Evitar Duplicados y Crear si No Existe
- Buscar registro existente por: `fecha + producto + idSheet + dia`
- **Si existe registro** → PATCH (actualizar solo el campo que cambió)
- **Si NO existe registro** → POST (crear registro nuevo) y luego actualizar
- Esto permite:
  - Agregar `adicional` a productos que no vinieron de app móvil
  - Registrar movimientos aunque no haya llegado nada de la app
  - Tener historial completo para reportes futuros

### Manejo de Errores
- Si falla la sincronización → Guardar en cola de pendientes
- Mostrar indicador visual de "sin sincronizar"
- Reintentar al reconectar

### Campos Calculados
- `total` se calcula automáticamente en el modelo: `cantidad - dctos + adicional - devoluciones - vencidas`
- `neto` se calcula: `total * valor`
- NO sincronizar estos campos, se calculan en el save()

### Estados del Botón y Permisos
| Estado | Campos Editables |
|--------|------------------|
| SUGERIDO | adicional, dctos |
| ALISTAMIENTO_ACTIVO | d, adicional, dctos, devoluciones, vencidas, lotes, cumplimiento, pagos |
| FINALIZAR | Ninguno |
| COMPLETADO | Ninguno |

---

## Orden de Implementación

1. ✅ Crear este plan de trabajo
2. ✅ Backend: Los ViewSets ya soportan PATCH por defecto (ModelViewSet)
3. ✅ Frontend: Crear servicio `cargueRealtimeService.js` - COMPLETADO
4. ✅ Frontend: Modificar `PlantillaOperativa.jsx` para sincronizar productos - COMPLETADO
   - Agregado import de `cargueRealtimeService`
   - Modificada función `actualizarProducto()` para sincronizar en tiempo real
   - Cada cambio ahora: actualiza estado local → sincroniza con BD
5. ✅ Frontend: Modificar `ControlCumplimiento.jsx` para sincronizar - COMPLETADO
   - Agregado import de `cargueRealtimeService`
   - Modificada función `handleSeleccion()` para sincronizar en tiempo real
6. ✅ Frontend: Modificar `RegistroLotes.jsx` para sincronizar - COMPLETADO
   - Agregado import de `cargueRealtimeService`
   - Modificada función `guardarLotes()` para sincronizar en tiempo real
7. ✅ Frontend: Modificar `ResumenVentas.jsx` para sincronizar pagos - COMPLETADO
   - Agregado import de `cargueRealtimeService`
   - Sincronización de base_caja, concepto, descuentos, nequi, daviplata
   - Sincronización de totales calculados: total_despacho, total_pedidos, total_dctos, venta, total_efectivo
   - Refs para evitar sincronización en carga inicial
8. ✅ Frontend: Ajustar `BotonLimpiar.jsx` para no duplicar guardado - COMPLETADO
   - Modificada función `guardarDatosCompletos()` para solo verificar datos pendientes
   - Los datos ya sincronizados en tiempo real no se vuelven a guardar
9. ✅ Fix: Corregir formato de fecha en sincronización - COMPLETADO
   - `fechaSeleccionada` es objeto Date, se debe convertir a YYYY-MM-DD
   - Corregido en: RegistroLotes.jsx, ControlCumplimiento.jsx, ResumenVentas.jsx
10. 🔲 Pruebas: Verificar sincronización en tiempo real
11. 🔲 Pruebas: Verificar que no hay duplicados
12. 🔲 Pruebas: Verificar cambio de equipo mantiene datos

---

## Pruebas a Realizar

- [ ] Editar adicional → Verificar que se guarda en BD inmediatamente
- [ ] Marcar checkbox D → Verificar que se guarda en BD
- [ ] Cambiar de equipo → Verificar que los datos persisten
- [ ] Completar flujo → Verificar que no hay duplicados
- [ ] Fallo de red → Verificar que localStorage mantiene datos
- [ ] Reconexión → Verificar que sincroniza pendientes

---

## Notas

- Los campos `cantidad` y `v` NO se tocan desde web (vienen de app móvil)
- El campo `responsable` se maneja aparte (ResponsableManager)
- Los pedidos están en tabla separada, no se tocan aquí

---

## Bugs Corregidos

### Bug 1: Formato de fecha incorrecto (2 Dic 2025)
**Problema:** `fechaSeleccionada` es un objeto Date, pero la API espera formato YYYY-MM-DD.
**Solución:** Agregar conversión de fecha antes de llamar a `actualizarCampoGlobal()`:
```javascript
let fechaParaBD;
if (fechaSeleccionada instanceof Date) {
  const year = fechaSeleccionada.getFullYear();
  const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
  const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
  fechaParaBD = `${year}-${month}-${day}`;
} else {
  fechaParaBD = fechaSeleccionada;
}
```
**Archivos corregidos:**
- `RegistroLotes.jsx`
- `ControlCumplimiento.jsx`
- `ResumenVentas.jsx`

### Bug 2: Estado COMPLETADO no detectado correctamente (2 Dic 2025)
**Problema:** El prop `estadoCompletado` no llegaba correctamente a los componentes `ControlCumplimiento`, `RegistroLotes` y `ResumenVentas` porque la key del localStorage usaba `fechaSeleccionada` (objeto Date) en lugar del formato string YYYY-MM-DD.
**Solución:** 
1. En `PlantillaOperativa.jsx`: Crear variable memoizada `fechaFormateadaLS` para formatear la fecha
2. Usar `fechaFormateadaLS` en lugar de `fechaSeleccionada` al leer del localStorage
```javascript
// En PlantillaOperativa.jsx
const fechaFormateadaLS = useMemo(() => {
    if (fechaSeleccionada instanceof Date) {
        return fechaSeleccionada.toISOString().split('T')[0];
    }
    return fechaSeleccionada || '';
}, [fechaSeleccionada]);

// Uso en props
estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`) === 'COMPLETADO'}
```
**Archivos corregidos:**
- `PlantillaOperativa.jsx` - Lectura de estado del localStorage
- `BotonLimpiar.jsx` - Lectura y escritura de estado en localStorage

### Bug 3: Campo lotes_produccion no se guardaba en BD (2 Dic 2025)
**Problema:** Los lotes de producción se agregaban en el frontend pero no aparecían en la base de datos. El PATCH devolvía OK pero el campo no se actualizaba.
**Causa raíz:** El campo `lotes_produccion` existía en el modelo `CargueID1` (y otros) pero NO estaba incluido en los serializers de Django REST Framework. Por lo tanto, el PATCH ignoraba silenciosamente el campo.
**Solución:** Agregar `lotes_produccion` y `ruta` a la lista de `fields` en todos los serializers:
```python
# api/serializers.py - CargueID1Serializer (y ID2-ID6)
fields = [
    'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
    'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total',  # ← Agregado
    'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
    'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
    'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
    'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
    'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo',  # ← Agregado ruta
    'fecha_creacion', 'fecha_actualizacion'
]
```
**Archivos corregidos:**
- `api/serializers.py` - Todos los serializers CargueID1-ID6

### Bug 4: Búsqueda de registros no incluía el día (2 Dic 2025)
**Problema:** La función `actualizarCampoGlobal` en `cargueRealtimeService.js` buscaba registros solo por fecha, sin filtrar por día. Esto causaba que se actualizara el registro incorrecto cuando había múltiples días con la misma fecha.
**Solución:** Agregar el parámetro `dia` a la URL de búsqueda:
```javascript
// Antes
const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}`;

// Después
const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia.toUpperCase()}`;
```
**Archivos corregidos:**
- `frontend/src/services/cargueRealtimeService.js`

### Bug 5: Datos no se cargan desde BD en estado COMPLETADO (2 Dic 2025)
**Problema:** Cuando el día está en estado COMPLETADO, los campos devoluciones, vencidas y lotes_vencidos aparecen en 0 aunque tienen datos en la BD.
**Causa raíz:** La función `cargarDatosDesdeDB()` en `PlantillaOperativa.jsx` estaba deshabilitada (`const response = null;` y `if (false && ...)`), por lo que siempre caía al fallback de localStorage.
**Solución:** Rehabilitar la función para que consulte directamente la API:
```javascript
// Nuevo código que consulta la BD directamente
const endpoint = idSheet === 'ID1' ? 'cargue-id1' : ...;
const url = `http://localhost:8000/api/${endpoint}/?fecha=${fechaParaBD}&dia=${dia.toUpperCase()}`;
const fetchResponse = await fetch(url);
const response = fetchResponse.ok ? await fetchResponse.json() : [];
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - función `cargarDatosDesdeDB()`

### Bug 6: Input BASE CAJA no se deshabilita en COMPLETADO (2 Dic 2025)
**Problema:** El input de BASE CAJA seguía editable cuando el día estaba en estado COMPLETADO.
**Solución:** Agregar `disabled={estadoCompletado}` al input.
**Archivos corregidos:**
- `frontend/src/components/Cargue/ResumenVentas.jsx`

### Bug 7: Productos en COMPLETADO no respetan el orden de la tabla (2 Dic 2025)
**Problema:** Al cargar datos desde BD en estado COMPLETADO, los productos aparecían en orden diferente al de la tabla de productos (ej: AREPA TIPO OBLEA 500Gr debería estar primero pero aparecía último).
**Causa raíz:** El ordenamiento usaba `p.orden` del producto, pero todos los productos tienen `orden=0` en la BD. Además, se usaba `p.orden !== undefined ? p.orden : index` lo cual siempre daba 0.
**Solución:** Usar el índice del array `products` del contexto como orden, ya que ese es el orden real en que aparecen en la tabla:
```javascript
// Crear mapa de orden basado en el índice del array
const ordenProductos = {};
products.forEach((p, index) => {
    ordenProductos[p.name] = index;  // Usar índice como orden
});

// Ordenar productos de BD según el mapa
const productosOrdenados = [...productosDesdeDB].sort((a, b) => {
    const ordenA = ordenProductos[a.producto] !== undefined ? ordenProductos[a.producto] : 999999;
    const ordenB = ordenProductos[b.producto] !== undefined ? ordenProductos[b.producto] : 999999;
    return ordenA - ordenB;
});
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - función `cargarDatosDesdeDB()`

### Bug 8: Registro de Lotes no se muestra en COMPLETADO (2 Dic 2025)
**Problema:** En estado COMPLETADO dice "No hay lotes registrados" aunque se guardaron lotes en la BD.
**Causa raíz:** El código buscaba `lotes_produccion` solo en el primer registro (`data[0]`), pero los lotes estaban guardados en otro registro (ej: ID 888 tenía los lotes, pero ID 892 era el primero y tenía `[]`).
**Solución:** Buscar en TODOS los registros hasta encontrar uno con lotes:
```javascript
// Buscar en CUALQUIER registro (no solo el primero)
for (const registro of data) {
    if (registro.lotes_produccion && registro.lotes_produccion !== '[]') {
        const lotesDB = JSON.parse(registro.lotes_produccion);
        if (Array.isArray(lotesDB) && lotesDB.length > 0) {
            setLotes(lotesDB);
            return;
        }
    }
}
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/RegistroLotes.jsx`

### Bug 9: BASE CAJA muestra valor incorrecto (2 Dic 2025)
**Problema:** Usuario digitó 50000 pero aparece 5000.
**Causa raíz:** El código tomaba "el primer valor no cero" de `base_caja`, pero había múltiples registros con diferentes valores (ID 892: 5000, ID 888: 50000). El orden de los registros hacía que se tomara el valor incorrecto.
**Solución:** Tomar el valor MÁXIMO de `base_caja` en lugar del primero:
```javascript
// Antes: tomar el primer valor no cero
if (item.base_caja && parseFloat(item.base_caja) > 0 && baseCajaDB === 0) {

// Después: tomar el valor MÁXIMO
if (item.base_caja && parseFloat(item.base_caja) > baseCajaDB) {
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/ResumenVentas.jsx`

---

## Pendientes por Verificar

### Bug 10: Snapshot de Planeación no se guarda (2 Dic 2025)
**Problema:** Al consultar Reportes de Planeación para fecha 2025-09-20 aparece "No hay snapshot guardado", aunque el usuario sí hizo la transición SUGERIDO → ALISTAMIENTO_ACTIVO.
**Causa raíz:** La función `guardarSnapshotPlaneacion()` buscaba datos de cargue SOLO en la BD (`cargue-id1`, etc.), pero cuando se hace la transición SUGERIDO → ALISTAMIENTO_ACTIVO, los datos aún están en localStorage (no se han sincronizado con la BD).
**Solución:** Agregar fallback a localStorage si no hay datos en la BD:
```javascript
// Primero intentar desde BD
let datosEncontradosEnBD = false;
for (const id of idsVendedores) {
    const response = await fetch(`/api/cargue-${id.toLowerCase()}/?fecha=${fechaFormateada}`);
    if (response.ok) {
        const cargueData = await response.json();
        if (cargueData.length > 0) datosEncontradosEnBD = true;
        // ... procesar datos
    }
}

// Si no hay datos en BD, buscar en localStorage
if (!datosEncontradosEnBD) {
    const { simpleStorage } = await import('../../services/simpleStorage');
    for (const diaActual of diasSemana) {
        for (const id of idsVendedores) {
            const key = `cargue_${diaActual}_${id}_${fechaFormateada}`;
            const datos = await simpleStorage.getItem(key);
            // ... procesar datos
        }
    }
}
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/BotonLimpiar.jsx` - función `guardarSnapshotPlaneacion()`

### Bug 11: Bucle infinito en PlantillaOperativa (2 Dic 2025)
**Problema:** 1,137 mensajes en consola - bucle infinito causado por useEffects en cascada.
**Causa raíz:** El useEffect que actualiza el contexto llamaba a `cargarDatosGuardados()` cada vez que cambiaba `products`, lo cual modificaba `productosOperativos`, disparando otros useEffects en cascada.
**Solución:** 
1. Agregar ref `contextoActualizadoRef` para evitar múltiples ejecuciones
2. Solo ejecutar `cargarDatosGuardados()` cuando `productosOperativos.length === 0`
3. Resetear el ref cuando cambia día/fecha
**Archivos corregidos:**
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`

### Bug 12: Total Pedidos no se actualiza al crear pedido (2 Dic 2025)
**Problema:** Al crear un pedido nuevo, el "Total Pedidos" en Cargue no se actualiza automáticamente. Solo se actualiza cuando el usuario cambia de pestaña (ID) y regresa.
**Causa raíz:** El `useEffect` que carga los pedidos solo se ejecutaba cuando cambiaban `fechaSeleccionada` o `idSheet`, no cuando se creaba un nuevo pedido.
**Solución:** 
1. Agregar evento personalizado `pedidoCreado` que se dispara al crear un pedido
2. Escuchar ese evento en `PlantillaOperativa` para recargar el total de pedidos
```javascript
// En api.js - al crear pedido exitosamente
window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: result }));

// En PlantillaOperativa.jsx - escuchar el evento
const handleNuevoPedido = () => {
    console.log(`📦 ${idSheet} - Nuevo pedido detectado, recargando total...`);
    cargarYActualizarPedidos();
};
window.addEventListener('pedidoCreado', handleNuevoPedido);
```
**Archivos corregidos:**
- `frontend/src/services/api.js` - función `create` de pedidos
- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - useEffect de pedidos

### Bug 13: Registros duplicados al marcar check V desde app móvil (2 Dic 2025)
**Problema:** Al agregar un producto desde web y luego marcar el check V desde la app móvil, se creaban dos registros duplicados en la BD.
**Causa raíz:** 
1. El endpoint `actualizar_check_vendedor` devolvía error 404 si el producto no existía, luego lo modifiqué para crear el registro, pero usaba `create()` en lugar de `get_or_create()`.
2. El servicio `cargueRealtimeService.js` buscaba registros solo por `fecha+producto` sin incluir `dia`, lo que causaba que no encontrara el registro correcto.
**Solución:**
1. Backend: Usar `get_or_create()` en lugar de `create()` para evitar duplicados
2. Frontend: Agregar `dia` a la búsqueda de registros existentes
```python
# api/views.py - actualizar_check_vendedor
registro, created = Modelo.objects.get_or_create(
    dia=dia,
    fecha=fecha,
    producto=producto,
    defaults={'cantidad': 0, 'v': False, 'd': False, 'responsable': 'Sistema'}
)
```
```javascript
// cargueRealtimeService.js - incluir dia en búsqueda
const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia.toUpperCase()}&producto=${encodeURIComponent(productoNombre)}`;
```
**Archivos corregidos:**
- `api/views.py` - función `actualizar_check_vendedor`
- `frontend/src/services/cargueRealtimeService.js` - funciones `actualizarCampoProducto` y `actualizarMultiplesCampos`

### Bug 14: Duplicados por doble sistema de sincronización (2 Dic 2025)
**Problema:** Seguían apareciendo registros duplicados a pesar de usar `get_or_create`.
**Causa raíz:** Había DOS sistemas de sincronización activos al mismo tiempo:
1. `cargueRealtimeService.actualizarCampoProducto()` - sincroniza campo por campo en tiempo real
2. `cargueHybridService.guardarDatos()` → `cargueService.guardarCargueCompleto()` - sincroniza todos los productos con debounce de 3 segundos

Ambos podían crear el mismo registro casi al mismo tiempo, causando duplicados.
**Solución:** Deshabilitar `cargueHybridService.guardarDatos()` ya que ahora usamos sincronización en tiempo real con `cargueRealtimeService`.
```javascript
// DESHABILITADO en PlantillaOperativa.jsx
// cargueHybridService.guardarDatos(dia, idSheet, fechaAUsar, productosOperativos, true);
console.log(`📝 ${idSheet} - Cambio guardado en localStorage (sincronización en tiempo real activa)`);
```
**Archivos corregidos:**
- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - useEffect de guardado automático

### Bug 15: Restricción única para evitar duplicados a nivel BD (2 Dic 2025)
**Problema:** A pesar de las correcciones en el código, seguían apareciendo duplicados por condiciones de carrera.
**Solución:** Agregar restricción `unique_together` en los modelos CargueID1-ID6 para que la BD rechace duplicados:
```python
class Meta:
    unique_together = ['dia', 'fecha', 'producto']
```
**Archivos corregidos:**
- `api/models.py` - Todos los modelos CargueID1-ID6
- Migración: `api/migrations/0052_add_unique_constraint_cargue.py`

---

Fecha última actualización: 2 de Diciembre 2025
