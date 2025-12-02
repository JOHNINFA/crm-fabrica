# AJUSTE CARGUE - Corrección de Registros Fantasma

## Problema Identificado
Al recargar el navegador o cambiar a fechas antiguas en el módulo de Cargue, se creaban registros "fantasma" en la tabla `api_cargueid1` con fechas que no correspondían al día actual de trabajo.

**Causa raíz**: El sistema sincronizaba automáticamente los datos del localStorage al servidor cada vez que se cargaban datos, sin distinguir entre:
- Carga inicial de datos existentes
- Cambios manuales del usuario

## Solución Implementada

### Archivos Modificados

1. **`frontend/src/services/cargueApiService.js`**
   - Agregado parámetro `sincronizarServidor` a la función `guardarDatos()`
   - Por defecto es `true`, pero se puede pasar `false` para solo guardar en localStorage

2. **`frontend/src/components/Cargue/PlantillaOperativa.jsx`**
   - Agregado `useRef` para rastrear cambios manuales: `cambioManualRef`
   - Modificado `useEffect` de guardado automático para:
     - SIEMPRE guardar en localStorage
     - SOLO sincronizar al servidor cuando `cambioManualRef.current === true`
   - Modificada función `actualizarProducto()` para marcar `cambioManualRef.current = true` cuando el usuario edita un campo

### Lógica Nueva

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE SINCRONIZACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Usuario recarga navegador / cambia fecha                    │
│           ↓                                                  │
│  Carga datos desde localStorage                              │
│           ↓                                                  │
│  cambioManualRef.current = false (por defecto)               │
│           ↓                                                  │
│  ✅ Guarda en localStorage                                   │
│  ❌ NO sincroniza al servidor                                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Usuario edita un campo (cantidad, dctos, etc.)              │
│           ↓                                                  │
│  cambioManualRef.current = true                              │
│           ↓                                                  │
│  ✅ Guarda en localStorage                                   │
│  ✅ Sincroniza al servidor                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Pruebas Realizadas

- [x] Enviar datos desde la app móvil (AP GUERRERO) para fecha 27/09/2025 ✅
- [x] Verificar que los datos lleguen a la BD ✅
- [x] Verificar que se muestren en el frontend web ✅
- [x] Recargar navegador y confirmar que NO se crean registros duplicados ✅

## Lógica de Planeación/Producción (Verificada)

### Estados del Botón y Comportamiento

| Estado | Planeación | Solicitadas |
|--------|------------|-------------|
| SUGERIDO | Editable | Se guardan automáticamente en BD |
| ALISTAMIENTO_ACTIVO | CONGELADA | NO se guardan más cambios |
| DESPACHO | CONGELADA | NO se guardan más cambios |
| FINALIZAR | CONGELADA | NO se guardan más cambios |
| COMPLETADO | CONGELADA | NO se guardan más cambios |

### Flujo de Congelado

1. Usuario en estado SUGERIDO → Datos se calculan y guardan en BD
2. Usuario pasa a ALISTAMIENTO_ACTIVO → Datos se congelan en localStorage (`produccion_congelada_${dia}_${fecha}`)
3. Cualquier cambio posterior en CARGUE NO afecta las solicitadas congeladas
4. Los datos congelados se usan para mostrar en Planeación

## Script de Limpieza

Se creó `borrar_fecha_fantasma.py` para eliminar registros con fechas problemáticas:

```bash
python3 borrar_fecha_fantasma.py
```

---
Fecha: 2025-12-02
