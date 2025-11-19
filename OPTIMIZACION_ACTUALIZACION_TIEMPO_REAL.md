# ⚡ Optimización de Actualización en Tiempo Real - Planeación

## 🎯 Problema Identificado

Cuando se agrega una cantidad en Cargue (ej: 5 en ID1 + 5 en ID2), la columna **SOLICITADAS** en Planeación se demoraba un poco en actualizarse.

## ✅ Soluciones Implementadas

### 1. **Reducción del Tiempo de Cache** ⚡
- **Antes**: 15 segundos
- **Ahora**: 3 segundos
- **Impacto**: Actualización 5x más rápida

```javascript
const CACHE_DURATION = 3000; // 3 segundos (antes 15000)
```

### 2. **Actualización Automática Cada 3 Segundos** 🔄
- Solo cuando el día NO está congelado
- Se desactiva automáticamente en días completados
- Optimiza recursos en días históricos

```javascript
// 🚀 ACTUALIZACIÓN AUTOMÁTICA: Solo si el día NO está congelado
let intervalo;
if (!diaCongelado) {
  console.log('🔄 Activando actualización automática cada 3 segundos');
  intervalo = setInterval(() => {
    cargarExistenciasReales(true);
  }, 3000);
}
```

### 3. **Respuesta Inmediata a Eventos** 🚀
- Delay reducido de 100ms a 50ms
- Limpieza agresiva de cache
- Timestamp de última actualización

```javascript
const handleCargueActualizado = (event) => {
  // 🔥 Limpiar cache
  setCache({ datos: null, timestamp: null, fecha: null });
  
  // 🔥 Limpiar localStorage
  localStorage.removeItem(`planeacion_${fechaActual}`);
  
  // 🚀 Marcar timestamp
  setUltimaActualizacion(Date.now());
  
  // 🚀 ACTUALIZACIÓN INMEDIATA
  setTimeout(() => {
    cargarExistenciasReales(true);
  }, 50); // Solo 50ms
};
```

---

## 📊 Comparación de Tiempos

### Antes de la Optimización
```
Usuario escribe en Cargue
    ↓
Evento se dispara
    ↓
⏱️ Espera hasta 15 segundos (cache)
    ↓
Actualiza Planeación
```
**Tiempo total**: 1-15 segundos

### Después de la Optimización
```
Usuario escribe en Cargue
    ↓
Evento se dispara
    ↓
⏱️ 50ms de delay
    ↓
Actualiza Planeación
    ↓
🔄 Polling cada 3s (backup)
```
**Tiempo total**: 50ms - 3 segundos máximo

---

## 🎯 Flujo Optimizado

```
┌─────────────────────────────────────────────────────┐
│  Usuario escribe cantidad en Cargue                 │
│  Ejemplo: 5 en ID1 + 5 en ID2                       │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Evento cargueActualizado     │
        │  se dispara automáticamente   │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  ⚡ 50ms de delay              │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  🔥 Limpia cache y localStorage│
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  📡 Consulta API de Cargue    │
        │  (ID1, ID2, ID3, ID4, ID5, ID6)│
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  🧮 Suma cantidades:          │
        │  ID1: 5 + ID2: 5 = 10         │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  ✅ Actualiza SOLICITADAS: 10 │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  🔄 Polling cada 3s (backup)  │
        │  por si falla el evento       │
        └───────────────────────────────┘
```

---

## 🚀 Mejoras de Performance

### 1. **Días Activos (Editables)**
- ✅ Actualización cada 3 segundos
- ✅ Respuesta inmediata a eventos (50ms)
- ✅ Cache de 3 segundos

### 2. **Días Congelados (Completados)**
- ✅ Sin polling automático (ahorra recursos)
- ✅ Solo carga desde BD una vez
- ✅ No consulta APIs dinámicas

### 3. **Optimización de Red**
- ✅ Consultas paralelas con `Promise.all()`
- ✅ Cache en memoria y localStorage
- ✅ Limpieza automática de datos viejos (7 días)

---

## 🧪 Cómo Probar

### Test 1: Actualización Rápida
1. Abrir **Planeación** en una pestaña
2. Abrir **Cargue** en otra pestaña
3. En Cargue, escribir cantidad en ID1 (ej: 5)
4. Cambiar a pestaña de Planeación
5. **Resultado esperado**: Se actualiza en menos de 3 segundos

### Test 2: Suma de Múltiples IDs
1. En Cargue ID1, escribir 5 en "AREPA QUESO MINI X10"
2. En Cargue ID2, escribir 5 en "AREPA QUESO MINI X10"
3. Ir a Planeación
4. **Resultado esperado**: SOLICITADAS muestra 10 (suma de ambos)

### Test 3: Día Congelado
1. Activar ALISTAMIENTO en Cargue
2. Ir a Planeación
3. Verificar que NO hay polling automático
4. **Resultado esperado**: Consola muestra "🔒 Actualización automática desactivada"

---

## 📝 Logs en Consola

### Día Activo (Editable)
```
📅 Cargando datos para fecha: 2025-11-19
🔄 Activando actualización automática cada 3 segundos (día editable)
🔄 Actualización automática en segundo plano...
✅ Stocks: 50
✅ Cargue ID1: 10 registros
✅ Cargue ID2: 8 registros
📊 SOLICITADAS TOTALES: { "AREPA QUESO MINI X10": 10 }
```

### Evento Recibido
```
🚚 Cargue actualizado - Evento recibido: { fecha: "2025-11-19", idSheet: "ID1", campo: "cantidad" }
🔍 Comparando fechas: evento=2025-11-19, actual=2025-11-19
✅ Fechas coinciden - Actualizando Planeación INMEDIATAMENTE...
🔄 Cargando datos desde servidor...
```

### Día Congelado
```
📅 Cargando datos para fecha: 2025-11-18
🔒 DÍA CONGELADO - Estado: COMPLETADO - No se permiten modificaciones
🔒 Actualización automática desactivada (día congelado)
✅ DÍA COMPLETADO - Cargando solo desde planeación guardada (optimizado)
```

---

## 🎨 Indicadores Visuales

### Mientras Actualiza
- Sin indicador visible (actualización silenciosa)
- Los números cambian suavemente
- No hay parpadeo ni saltos

### Datos Actualizados
- Los valores se actualizan en tiempo real
- La suma se calcula automáticamente
- El total se recalcula instantáneamente

---

## 🔧 Configuración

### Variables Ajustables

```javascript
// Duración del cache (en milisegundos)
const CACHE_DURATION = 3000; // 3 segundos

// Intervalo de polling (en milisegundos)
const POLLING_INTERVAL = 3000; // 3 segundos

// Delay después de evento (en milisegundos)
const EVENT_DELAY = 50; // 50ms
```

### Ajustar según necesidad:
- **Más rápido**: Reducir a 1-2 segundos (más carga en servidor)
- **Más lento**: Aumentar a 5-10 segundos (menos carga, más delay)
- **Recomendado**: 3 segundos (balance óptimo)

---

## 📊 Impacto en Recursos

### Antes
- Consultas cada 15 segundos
- Cache largo
- Respuesta lenta a eventos

### Ahora
- Consultas cada 3 segundos (solo días activos)
- Cache corto (3s)
- Respuesta inmediata a eventos (50ms)

### Consumo de Red
- **Días activos**: ~20 consultas/minuto
- **Días congelados**: 1 consulta inicial
- **Optimización**: 95% menos consultas en días históricos

---

## ✅ Beneficios

1. **Experiencia de Usuario Mejorada** ⚡
   - Actualización casi instantánea
   - Sin necesidad de recargar manualmente
   - Feedback visual inmediato

2. **Performance Optimizado** 🚀
   - Cache inteligente
   - Polling solo cuando es necesario
   - Consultas paralelas

3. **Ahorro de Recursos** 💰
   - No consulta APIs en días completados
   - Limpieza automática de datos viejos
   - Uso eficiente de localStorage

4. **Confiabilidad** 🛡️
   - Sistema de eventos + polling (doble seguridad)
   - Manejo de errores robusto
   - Logs detallados para debugging

---

## 🐛 Troubleshooting

### Problema: Sigue demorando
**Solución:**
1. Verificar que el evento se dispare:
   ```javascript
   // En consola del navegador
   window.addEventListener('cargueActualizado', (e) => console.log('Evento:', e.detail));
   ```
2. Reducir `CACHE_DURATION` a 1000ms
3. Verificar que el backend responda rápido

### Problema: Actualiza demasiado rápido (parpadea)
**Solución:**
1. Aumentar `CACHE_DURATION` a 5000ms
2. Aumentar `EVENT_DELAY` a 200ms
3. Desactivar polling si solo quieres eventos

### Problema: No actualiza en absoluto
**Solución:**
1. Verificar que el día NO esté congelado
2. Verificar logs en consola
3. Verificar que el backend esté corriendo
4. Limpiar cache del navegador

---

## 📞 Soporte

**Logs importantes a revisar:**
- `🔄 Activando actualización automática` → Polling activado
- `🚚 Cargue actualizado` → Evento recibido
- `✅ Fechas coinciden` → Actualización iniciada
- `🔒 Actualización automática desactivada` → Día congelado

**Comandos útiles en consola:**
```javascript
// Ver estado del cache
console.log(localStorage.getItem('planeacion_2025-11-19'));

// Ver estado del día
console.log(localStorage.getItem('estado_boton_MARTES_2025-11-19'));

// Forzar actualización
window.dispatchEvent(new CustomEvent('cargueActualizado', {
  detail: { fecha: '2025-11-19', idSheet: 'ID1', campo: 'cantidad' }
}));
```

---

**Fecha de optimización**: 19/11/2025  
**Versión**: 1.1.0  
**Estado**: ✅ OPTIMIZADO
