# 🔄 Sincronización Entre Navegadores - CRM Fábrica

## 📋 ¿Qué es esto?

Sistema de sincronización en tiempo real que permite que múltiples usuarios vean los mismos datos actualizados en diferentes navegadores (incluyendo modo incógnito) sin recargar la página.

**Caso de uso**: Un usuario edita "devoluciones: 5" en Chrome normal, y otro usuario en Chrome incógnito ve el cambio automáticamente en máximo 6 segundos.

---

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│              NAVEGADOR NORMAL (Chrome)                      │
│                                                             │
│  Usuario escribe: "devoluciones: 5"                        │
│         │                                                   │
│         ▼                                                   │
│  Estado local actualizado (instantáneo)                    │
│         │                                                   │
│         ▼                                                   │
│  Debounce 1.5s → PATCH a BD                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS PostgreSQL                   │
│                                                             │
│  Campo: devoluciones = 5                                   │
│  Campo: fecha_actualizacion = "2026-02-13T04:25:30.123Z"  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           NAVEGADOR INCÓGNITO (Chrome)                      │
│                                                             │
│  Polling cada 4s → GET /verificar-actualizaciones/         │
│         │                                                   │
│         ▼                                                   │
│  Detecta cambio en fecha_actualizacion                     │
│         │                                                   │
│         ▼                                                   │
│  Carga datos frescos → Muestra "devoluciones: 5" ✅        │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Componentes del Sistema

### 1. Polling Inteligente (Frontend)

**Archivo**: `frontend/src/components/Cargue/PlantillaOperativa.jsx`

```javascript
// Cada 4 segundos verifica si hay cambios
useEffect(() => {
    const interval = setInterval(() => {
        if (!cambioManualRef.current) {
            verificarActualizaciones();
        }
    }, 4000);
    
    return () => clearInterval(interval);
}, []);
```

**Características**:
- Frecuencia: Cada 4 segundos
- Endpoint: `/api/cargue/verificar-actualizaciones/`
- Función: Compara timestamps para detectar cambios
- Pausa automática cuando el usuario está editando

### 2. Sincronización con Debounce (Frontend)

**Archivo**: `frontend/src/services/cargueRealtimeService.js`

```javascript
// Espera 1.5s después del último cambio antes de sincronizar
const debouncedSync = debounce((data) => {
    axios.patch(`/api/cargue/${id}/`, data);
}, 1500);
```

**Características**:
- Debounce: 1.5 segundos
- Método: PATCH parcial (solo campos modificados)
- Evita saturar el servidor con múltiples requests

### 3. Endpoint de Verificación (Backend)

**Archivo**: `api/views.py`

```python
@api_view(['GET'])
def verificar_actualizaciones(request):
    """Endpoint ultraligero que solo devuelve timestamp"""
    cargue = CargueID1.objects.get(id=request.GET.get('id'))
    return Response({
        'last_update': cargue.fecha_actualizacion.isoformat()
    })
```

**Características**:
- Método: GET
- Respuesta mínima: Solo timestamp
- Muy rápido: No carga datos completos

---

## 🔄 Flujos de Sincronización

### Escenario 1: Usuario escribe en Navegador Normal

```
TIEMPO | NAVEGADOR NORMAL          | BASE DE DATOS           | NAVEGADOR INCÓGNITO
-------|---------------------------|-------------------------|---------------------
0.0s   | Usuario escribe "5"       |                         |
0.0s   | Estado local = 5 ✅       |                         |
0.0s   | cambioManualRef = true    |                         |
       | (pausa polling)           |                         |
-------|---------------------------|-------------------------|---------------------
1.5s   | Debounce → PATCH          |                         |
1.5s   |                           | devoluciones = 5 ✅     |
1.5s   |                           | fecha_actualizacion ✅  |
-------|---------------------------|-------------------------|---------------------
3.0s   | cambioManualRef = false   |                         |
       | (reactiva polling)        |                         |
-------|---------------------------|-------------------------|---------------------
4.0s   |                           |                         | Polling detecta cambio
4.0s   |                           |                         | GET datos frescos
4.0s   |                           |                         | Muestra "5" ✅
```

**Latencia total**: Máximo 6 segundos (1.5s debounce + 4s polling)

### Escenario 2: App Móvil envía datos

```
TIEMPO | APP MÓVIL                 | BASE DE DATOS           | CRM WEB
-------|---------------------------|-------------------------|---------------------
0.0s   | Envía: cantidad=10        |                         |
0.0s   |        adicional=2        |                         |
0.0s   |        dctos=1            |                         |
-------|---------------------------|-------------------------|---------------------
0.1s   |                           | cantidad = 10 ✅        |
0.1s   |                           | adicional = 2 ✅        |
0.1s   |                           | dctos = 1 ✅            |
0.1s   |                           | fecha_actualizacion ✅  |
-------|---------------------------|-------------------------|---------------------
4.0s   |                           |                         | Polling detecta cambio
4.0s   |                           |                         | GET datos frescos
4.0s   |                           |                         | Muestra datos ✅
```

**Latencia total**: Máximo 4 segundos (solo polling)

---

## 🛡️ Protección Anti-Rebote

### Problema Original

```
Usuario escribe → Debounce 1.5s → Polling 2s → ¡Recarga antes de sincronizar!
Resultado: El valor desaparece (parpadeo) ❌
```

### Solución Implementada

```javascript
// Cuando usuario edita
const handleChange = (e) => {
    cambioManualRef.current = true; // PAUSA POLLING
    
    // Actualiza estado local
    setDatos({ ...datos, [campo]: e.target.value });
    
    // Sincroniza después de 1.5s
    debouncedSync({ [campo]: e.target.value });
    
    // Reactiva polling después de 3s
    setTimeout(() => {
        cambioManualRef.current = false;
    }, 3000);
};
```

**Resultado**: El polling espera a que el debounce sincronice ✅

---

## 📊 Campos por Origen

| Campo           | CRM Web | App Móvil | Notas                    |
|-----------------|---------|-----------|--------------------------|
| cantidad        | ❌      | ✅        | Solo desde app           |
| adicional       | ✅      | ✅        | Ambos pueden modificar   |
| dctos           | ✅      | ✅        | Ambos pueden modificar   |
| devoluciones    | ✅      | ❌        | Solo desde CRM           |
| vencidas        | ✅      | ❌        | Solo desde CRM           |
| lotes_vencidos  | ✅      | ❌        | Solo desde CRM           |
| v (check)       | ❌      | ✅        | Solo desde app           |
| d (check)       | ✅      | ❌        | Solo desde CRM           |

---

## ⚖️ Regla de Oro

**El último que escribe gana. La BD es la fuente de verdad.**

### Ejemplos:

**Caso 1**: Conflicto en mismo campo
```
10:00:00 → CRM escribe: devoluciones = 20
10:00:05 → App envía: devoluciones = 10
Resultado: devoluciones = 10 ✅ (App ganó porque escribió último)
```

**Caso 2**: Campos diferentes (sin conflicto)
```
10:00:00 → CRM escribe: devoluciones = 20
10:00:05 → App envía: cantidad = 10
Resultado: devoluciones = 20 ✅, cantidad = 10 ✅ (Ambos se preservan)
```

**Caso 3**: PATCH parcial
```
App envía: { cantidad: 10, adicional: 2 }
Django hace: UPDATE ... SET cantidad=10, adicional=2 WHERE id=X
Otros campos NO se tocan ✅
```

---

## ⏱️ Tiempos de Sincronización

| Operación                    | Tiempo      |
|------------------------------|-------------|
| CRM → BD (debounce)          | 1.5 segundos|
| BD → CRM (polling)           | Máx 4 segundos|
| Latencia total entre ventanas| Máx 6 segundos|
| Pausa anti-rebote            | 3 segundos  |

---

## 🐛 Debugging

### Logs en Consola del Navegador

Abre DevTools (F12) y busca estos mensajes:

```
🔍 Polling URL: /api/cargue/verificar-actualizaciones/?id=123&fecha=2026-02-13...
📡 Respuesta polling: { last_update: "2026-02-13T04:25:30.123Z" }
⏰ Comparando tiempos: Local=2026-02-13T04:25:20.000Z Remoto=2026-02-13T04:25:30.123Z
🚀 CAMBIO REMOTO DETECTADO
🔄 ID1 - Sincronizando datos frescos...
📦 AREPA TIPO OBLEA: devoluciones=5, vencidas=6
✅ Datos locales están actualizados
```

### Verificar Sincronización

1. Abre Chrome normal en `http://localhost:3000/cargue`
2. Abre Chrome incógnito en la misma URL
3. Edita un campo en Chrome normal
4. Observa la consola de Chrome incógnito
5. Deberías ver el cambio en máximo 6 segundos

### Problemas Comunes

**Problema**: Los cambios no se sincronizan
```
✅ Verifica que el servidor esté corriendo
✅ Verifica que no haya errores en consola
✅ Verifica que fecha_actualizacion se actualice en BD
```

**Problema**: Parpadeo al escribir
```
✅ Verifica que cambioManualRef esté funcionando
✅ Verifica que el debounce sea 1.5s
✅ Verifica que la pausa sea 3s
```

**Problema**: Sincronización muy lenta
```
✅ Reduce el intervalo de polling (de 4s a 2s)
✅ Reduce el debounce (de 1.5s a 1s)
✅ Verifica la latencia de red
```

---

## 📁 Archivos Relacionados

### Frontend
- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Componente principal con polling
- `frontend/src/services/cargueRealtimeService.js` - Servicio de sincronización con debounce

### Backend
- `api/views.py` - Endpoints `verificar_actualizaciones` y PATCH de cargue
- `api/models.py` - Modelos CargueID1-6 con campo `fecha_actualizacion`
- `api/serializers.py` - Serializadores para PATCH parcial

---

## 🔧 Configuración Avanzada

### Cambiar Frecuencia de Polling

Edita `PlantillaOperativa.jsx`:

```javascript
// Cambiar de 4s a 2s
const interval = setInterval(() => {
    verificarActualizaciones();
}, 2000); // Era 4000
```

### Cambiar Tiempo de Debounce

Edita `cargueRealtimeService.js`:

```javascript
// Cambiar de 1.5s a 1s
const debouncedSync = debounce((data) => {
    axios.patch(`/api/cargue/${id}/`, data);
}, 1000); // Era 1500
```

### Cambiar Tiempo de Pausa Anti-Rebote

Edita `PlantillaOperativa.jsx`:

```javascript
// Cambiar de 3s a 2s
setTimeout(() => {
    cambioManualRef.current = false;
}, 2000); // Era 3000
```

---

## ✅ Checklist de Implementación

Si quieres implementar esto en otro módulo:

- [ ] Agregar campo `fecha_actualizacion` al modelo (auto_now=True)
- [ ] Crear endpoint `verificar_actualizaciones` (GET ultraligero)
- [ ] Implementar polling cada 4s en componente React
- [ ] Implementar debounce de 1.5s para sincronización
- [ ] Agregar bandera `cambioManualRef` para pausar polling
- [ ] Implementar pausa de 3s después de editar
- [ ] Usar PATCH parcial (solo campos modificados)
- [ ] Agregar logs de debugging en consola
- [ ] Probar con dos navegadores (normal + incógnito)

---

## 🎯 Resultado Final

✅ Sincronización en tiempo real entre múltiples navegadores
✅ Latencia máxima de 6 segundos
✅ Sin parpadeos ni pérdida de datos
✅ Funciona con navegador normal e incógnito
✅ Compatible con app móvil
✅ PATCH parcial (eficiente)
✅ Logs de debugging completos

---

**Fecha de implementación**: Febrero 2026  
**Estado**: ✅ OPERATIVO  
**Módulo**: Cargue (CargueID1-6)  
**Próximos módulos**: POS, Ventas, Stock

