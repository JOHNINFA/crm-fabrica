# 🔄 Solución: Sincronización en Tiempo Real - Módulo Cargue

## 📋 Problema Original

Cuando un usuario escribía valores en los campos **devoluciones** o **vencidas** en el navegador normal, estos cambios NO se reflejaban en otra ventana (modo incógnito) o en otro equipo.

### Síntomas:
- ✗ Escribir "devoluciones: 5" → Otra ventana no lo veía
- ✗ Escribir "vencidas: 10" → Otro equipo no lo veía
- ✗ Rebotes visuales: valores cambiaban y volvían al anterior
- ✗ Datos inconsistentes entre ventanas

---

## 🎯 Solución Implementada

### 1. Polling Inteligente (Smart Sync)

**Archivo**: `PlantillaOperativa.jsx` (líneas 1337-1396)

```javascript
// Verificar cambios cada 4 segundos
const pollingInterval = setInterval(async () => {
    // 1. Preguntar al servidor: "¿Hay cambios?"
    const res = await fetch(`${API_URL}/cargue/verificar-actualizaciones/?idSheet=${idSheet}&dia=${dia}&fecha=${fecha}`);
    
    // 2. Comparar timestamps
    const remoteTime = new Date(data.last_update).getTime();
    const localTime = window[localKey] || 0;
    
    // 3. Si hay cambios → Recargar
    if (remoteTime > localTime) {
        cargarDatosGuardados();
    }
}, 4000);
```

**Beneficios**:
- ⚡ Request ultraligero (solo timestamp)
- 🔄 Detecta cambios en 4 segundos máximo
- 💾 No satura el servidor

### 2. Carga Directa desde BD

**Archivo**: `PlantillaOperativa.jsx` (líneas 855-935)

**Antes** (❌ Problema):
```javascript
// Usaba servicio híbrido que mezclaba datos incorrectamente
const resultado = await cargueHybridService.cargarDatos(dia, idSheet, fecha);
```

**Ahora** (✅ Solución):
```javascript
// Carga DIRECTAMENTE desde tabla CargueIDx
const endpoint = endpointMap[idSheet]; // 'cargue-id1', 'cargue-id2', etc.
const response = await fetch(`${API_URL}/${endpoint}/?dia=${dia}&fecha=${fecha}`);
const registros = await response.json();

// Convierte registros de BD al formato del frontend
const productosDesdeDB = registros.map(reg => ({
    producto: reg.producto,
    cantidad: parseInt(reg.cantidad) || 0,
    devoluciones: parseInt(reg.devoluciones) || 0,
    vencidas: parseInt(reg.vencidas) || 0,
    // ... todos los campos
}));
```

**Beneficios**:
- ✅ Datos siempre frescos de la BD
- ✅ No hay merge incorrecto
- ✅ Fuente de verdad única

### 3. Protección Anti-Rebote

**Archivo**: `PlantillaOperativa.jsx` (líneas 1340-1342, 1712-1716)

**Problema**: El polling recargaba antes de que se sincronizara el cambio.

**Solución**:
```javascript
// Cuando usuario edita
const actualizarProducto = async (id, campo, valor) => {
    cambioManualRef.current = true; // 🛡️ Pausa polling
    
    // ... actualizar estado local ...
    
    // Sincronizar con BD después de 1.5s (debounce)
    setTimeout(() => {
        cargueRealtimeService.actualizarCampoProducto(...);
    }, 1500);
};

// En el useEffect de guardado
setTimeout(() => {
    cambioManualRef.current = false; // 🔓 Reactiva polling
}, 3000); // Espera 3s para que sincronice
```

**Flujo temporal**:
```
t=0s   → Usuario escribe "5"
t=0s   → cambioManualRef = true (polling pausado)
t=0s   → Estado local actualizado (UX instantánea)
t=1.5s → Debounce sincroniza con BD
t=3s   → cambioManualRef = false (polling reactivado)
t=4s   → Polling detecta cambio en otra ventana
```

**Beneficios**:
- ✅ Sin rebotes visuales
- ✅ UX suave y fluida
- ✅ Sincronización garantizada

---

## 🔧 Componentes Técnicos

### Backend

**Endpoint de Verificación** (`api/views.py` línea 204-233):
```python
@api_view(['GET'])
def verificar_actualizaciones(request):
    vendedor_id = request.query_params.get('idSheet')
    dia = request.query_params.get('dia')
    fecha = request.query_params.get('fecha')
    
    modelo = modelos.get(vendedor_id)  # CargueID1, CargueID2, etc.
    
    # Consulta ultraligera: solo max(fecha_actualizacion)
    resultado = modelo.objects.filter(dia=dia, fecha=fecha).aggregate(
        ultima=models.Max('fecha_actualizacion')
    )
    
    return Response({'last_update': resultado['ultima']})
```

**ViewSets** (`api/views.py` línea 865-913):
```python
class CargueID1ViewSet(viewsets.ModelViewSet):
    queryset = CargueID1.objects.all()
    serializer_class = CargueID1Serializer
    
    # Django REST Framework hace PATCH parcial automáticamente
    # Solo actualiza campos enviados, preserva el resto
```

### Frontend

**Servicio de Sincronización** (`cargueRealtimeService.js`):
```javascript
export const cargueRealtimeService = {
    actualizarCampoProducto: async (idSheet, dia, fecha, productoNombre, campo, valor) => {
        // 1. Buscar si existe registro
        const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia}&producto=${producto}`;
        const registros = await fetch(searchUrl).then(r => r.json());
        
        if (registros.length > 0) {
            // 2A. EXISTE → PATCH (actualizar solo el campo)
            await fetch(`${API_URL}/${endpoint}/${registros[0].id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ [campo]: valor })
            });
        } else {
            // 2B. NO EXISTE → POST (crear registro nuevo)
            await fetch(`${API_URL}/${endpoint}/`, {
                method: 'POST',
                body: JSON.stringify({ dia, fecha, producto, [campo]: valor })
            });
        }
    }
};
```

---

## 📊 Flujos de Datos

### Flujo 1: Usuario escribe en CRM Web

```
┌─────────────┐
│ Usuario CRM │ Escribe "devoluciones: 5"
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Estado Local React  │ Actualización inmediata (UX)
└──────┬──────────────┘
       │
       ▼ (1.5s debounce)
┌─────────────────────┐
│ cargueRealtimeService│ PATCH a BD
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Tabla CargueID1     │ devoluciones=5, fecha_actualizacion=NOW()
└──────┬──────────────┘
       │
       ▼ (4s polling)
┌─────────────────────┐
│ Otra Ventana/Equipo │ Detecta cambio y recarga
└─────────────────────┘
```

### Flujo 2: App Móvil envía datos

```
┌─────────────┐
│  App Móvil  │ Envía cantidad=10, adicional=2
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ API Backend         │ PATCH a CargueID1
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Tabla CargueID1     │ cantidad=10, adicional=2, fecha_actualizacion=NOW()
│                     │ Preserva: devoluciones=5 (no se toca)
└──────┬──────────────┘
       │
       ▼ (4s polling)
┌─────────────────────┐
│ CRM Web             │ Detecta cambio y recarga
│                     │ Muestra: cantidad=10, adicional=2, devoluciones=5 ✅
└─────────────────────┘
```

---

## 🎯 Reglas de Negocio

### Campos por Origen

| Campo | CRM Web | App Móvil | Comportamiento |
|-------|---------|-----------|----------------|
| cantidad | ❌ | ✅ | Solo app puede modificar |
| adicional | ✅ | ✅ | Ambos pueden modificar |
| dctos | ✅ | ✅ | Ambos pueden modificar |
| **devoluciones** | ✅ | ❌ | **Solo CRM puede modificar** |
| **vencidas** | ✅ | ❌ | **Solo CRM puede modificar** |
| lotes_vencidos | ✅ | ❌ | Solo CRM puede modificar |
| v (vendedor) | ❌ | ✅ | Solo app puede marcar |
| d (despachador) | ✅ | ❌ | Solo CRM puede marcar |

### Regla de Oro

**El último que escribe gana. La BD es la fuente de verdad.**

- CRM escribe devoluciones=20 → App envía devoluciones=10 → **Queda en 10**
- App envía cantidad=10 → CRM escribe cantidad=5 → **Queda en 5**
- App envía cantidad=10 (sin tocar devoluciones) → **Preserva devoluciones=20**

---

## ⏱️ Tiempos de Sincronización

| Acción | Tiempo |
|--------|--------|
| Escritura local → Estado React | **Instantáneo** (0ms) |
| Estado React → BD | **1.5 segundos** (debounce) |
| BD → Otra ventana (polling) | **Máximo 4 segundos** |
| **Latencia total entre ventanas** | **Máximo 6 segundos** |

---

## 🐛 Debugging

### Logs en Consola del Navegador

**Polling activo**:
```
🔍 Polling URL: /api/cargue/verificar-actualizaciones/?idSheet=ID1&dia=VIERNES&fecha=2026-02-13
📡 Respuesta polling: { last_update: "2026-02-13T04:25:30.123Z" }
⏰ Comparando tiempos: Local=2026-02-13T04:25:00.000Z, Remoto=2026-02-13T04:25:30.123Z
✅ Datos locales están actualizados
```

**Cambio detectado**:
```
🚀 CAMBIO REMOTO DETECTADO: 2026-02-13T04:25:30.123Z
🔄 ID1 - Sincronizando datos frescos...
✅ ID1 - Registros recibidos desde BD: 15
📦 AREPA TIPO OBLEA: devoluciones=5, vencidas=6
💾 ID1 - Datos guardados en localStorage desde BD
```

**Sincronización en tiempo real**:
```
✏️ ID1 - Cambio manual detectado en campo: devoluciones
🔄 Sincronizando: AREPA TIPO OBLEA | devoluciones → devoluciones = 5
📤 Enviando a BD después de debounce: AREPA TIPO OBLEA.devoluciones = 5
✅ BD sincronizada: AREPA TIPO OBLEA | devoluciones = 5 (updated)
```

### Verificar en Base de Datos

```sql
-- Ver última actualización de un producto
SELECT producto, devoluciones, vencidas, fecha_actualizacion
FROM api_cargueid1
WHERE dia = 'VIERNES' AND fecha = '2026-02-13'
ORDER BY fecha_actualizacion DESC;
```

---

## 📁 Archivos Modificados

### Frontend
- ✅ `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Polling y carga directa
- ✅ `frontend/src/services/cargueRealtimeService.js` - Sincronización en tiempo real

### Backend
- ✅ `api/views.py` - Endpoint `verificar_actualizaciones`
- ✅ `api/urls.py` - Ruta del endpoint

### Documentación
- ✅ `.kiro/steering/rag-context.md` - Contexto RAG actualizado
- ✅ `frontend/src/components/Cargue/SOLUCION_SINCRONIZACION.md` - Este archivo

---

## ✅ Resultado Final

### Antes (❌)
- Cambios no se sincronizaban entre ventanas
- Rebotes visuales constantes
- Datos inconsistentes
- Frustración del usuario

### Ahora (✅)
- ✅ Sincronización automática en máximo 6 segundos
- ✅ Sin rebotes ni parpadeos
- ✅ UX fluida e instantánea
- ✅ Datos consistentes en todos los dispositivos
- ✅ Funciona con CRM Web y App Móvil simultáneamente

---

## 🚀 Próximos Pasos

Si necesitas modificar la sincronización:

1. **Cambiar frecuencia de polling**: Modificar `4000` en línea 1396 de `PlantillaOperativa.jsx`
2. **Cambiar debounce**: Modificar `1500` en línea 1600 de `PlantillaOperativa.jsx`
3. **Agregar nuevos campos**: Actualizar `cargueRealtimeService.js` y modelos en `api/models.py`

---

**Fecha de implementación**: 13 de Febrero 2026  
**Desarrollado por**: Kiro AI Assistant  
**Estado**: ✅ Producción
