# 🔧 Fix Timeouts en Entrega de Pedidos - 24 Marzo 2026

## 🎯 Problema Detectado

Cuando el vendedor intenta entregar un pedido con conexión intermitente:
- ❌ Timeout muy largo (25-30 segundos) → Usuario no sabe si está funcionando
- ❌ Botón "CONFIRMAR PEDIDO" se queda bloqueado mucho tiempo
- ❌ Error aparece en toast pequeño que desaparece rápido
- ❌ No hay feedback visual claro mientras espera

## ✅ Solución Implementada

### 1. Timeouts Reducidos para Mejor UX

| Operación | ANTES | AHORA | Razón |
|-----------|-------|-------|-------|
| Marcar pedido entregado | 25s | 8s | Operación simple, debe ser rápida |
| Reportar novedad (no entregado) | 25s | 8s | Operación simple, debe ser rápida |
| Abrir turno | 25s | 10s | Operación con validaciones, puede tardar un poco más |
| Cargar stock de cargue | 30s | 15s | Carga de datos, puede tardar más |
| Precargar clientes | 25s | 15s | Carga de datos, puede tardar más |
| Anular venta (background) | 30s | 12s | Operación crítica, timeout medio |

### 2. Mensaje de Error Mejorado

**ANTES**: Toast negro pequeño que desaparece rápido
```
❌ Venta ID4-MOTOROLA/MALY/ALI9/P...
```

**AHORA**: Alert claro y visible
```
⚠️ Sin Conexión

No se pudo conectar con el servidor.

El pedido se guardará localmente y se 
sincronizará cuando tengas internet.

[Entendido]
```

### 3. Comportamiento Offline Preservado

✅ Todo el sistema offline sigue funcionando igual:
- Guarda localmente en AsyncStorage
- Agrega a cola de sincronización
- Actualiza UI inmediatamente
- Sincroniza automáticamente cuando vuelve internet

## 📱 Flujo Mejorado

### Con Conexión Intermitente (ANTES)
```
1. Usuario toca "Entregar"
2. Espera... 25 segundos sin feedback
3. Toast pequeño con error (desaparece rápido)
4. Botón se desbloquea después de un rato
5. Usuario confundido, no sabe si funcionó
```

### Con Conexión Intermitente (AHORA)
```
1. Usuario toca "Entregar"
2. Espera máximo 8 segundos
3. Alert claro: "Sin Conexión - Se guardará local"
4. Botón se desbloquea inmediatamente
5. Pedido se guarda local y sincroniza después
6. ✅ Usuario sabe exactamente qué pasó
```

## 🔍 Archivos Modificados

- `AP GUERRERO/components/Ventas/VentasScreen.js`
  - Línea ~1013: Timeout marcar entregado (25s → 8s)
  - Línea ~892: Timeout reportar novedad (25s → 8s)
  - Línea ~1313: Timeout abrir turno (25s → 10s)
  - Línea ~1434: Timeout precargar clientes (25s → 15s)
  - Línea ~3163: Timeout anular venta (30s → 12s)
  - Línea ~3757: Timeout cargar stock (30s → 15s)
  - Línea ~1067: Alert mejorado para errores de conexión

## ✅ Validación

### Escenarios Probados (Teóricos)

1. ✅ **Con internet bueno**: Todo funciona normal, más rápido
2. ✅ **Con internet intermitente**: Falla rápido (8s), muestra alert claro, guarda local
3. ✅ **Sin internet**: Falla inmediato, muestra alert, guarda local
4. ✅ **Sincronización posterior**: Cuando vuelve internet, sincroniza automáticamente

### Casos de Uso

- ✅ Entregar pedido con señal mala → Falla en 8s, guarda local
- ✅ Reportar novedad con señal mala → Falla en 8s, guarda local
- ✅ Abrir turno con señal mala → Falla en 10s, muestra error claro
- ✅ Cargar stock con señal mala → Usa caché, intenta actualizar en 15s

## 🚀 Próximos Pasos

1. Hacer commit de cambios
2. Subir al VPS
3. Probar en producción con conexión real intermitente
4. Validar que sincronización funcione correctamente

## 📝 Notas Técnicas

- **Timeouts más cortos NO rompen funcionalidad offline**: El fallback sigue funcionando igual
- **Alert en vez de Toast**: Más visible y no desaparece hasta que usuario lo cierre
- **Timeouts diferenciados**: Operaciones simples (8s), operaciones con datos (15s)
- **Cierre de turno mantiene 30s**: Es operación crítica con cálculos complejos

**Fecha de implementación**: 24 de Marzo de 2026
