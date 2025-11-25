# Problema: Consolidación Incorrecta de ADICIONAL y DCTOS en CANTIDAD

## Descripción del Problema

Cuando se editan los campos **ADICIONAL** o **DCTOS** en el módulo de Cargue (frontend CRM-Fabrica), los valores se están **consolidando incorrectamente en el campo CANTIDAD** y luego se resetean a 0.

### Comportamiento Esperado vs Actual
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
**ESPERADO:**
- CANTIDAD: 10 (fijo, viene desde la app)
- ADICIONAL: 10 (se escribe manualmente)
- DCTOS: 0
- TOTAL: 10 - 0 + 10 = 20

**ACTUAL (INCORRECTO):**
- CANTIDAD: 20 (se suma el adicional automáticamente)
- ADICIONAL: 0 (se resetea)
- DCTOS: 0
- TOTAL: 20

## Ejemplo Concreto

### Caso 1: AREPA TIPO OBLEA 500Gr
1. **Estado inicial** (desde app):
   - cantidad=10, adicional=0, dctos=0, total=10

2. **Usuario escribe** adicional=10:
   - cantidad=10, adicional=10, dctos=0, total=20 ✅ (correcto momentáneamente)

3. **Después de guardar/recargar**:
   - cantidad=20, adicional=0, dctos=0, total=20 ❌ (consolidado incorrectamente)

### Caso 2: AREPA MEDIANA 330Gr
1. **Estado inicial**:
   - cantidad=10, adicional=0, dctos=0, total=10

2. **Usuario escribe** dctos=5:
   - cantidad=10, adicional=0, dctos=5, total=5 ✅ (correcto momentáneamente)

3. **Después de guardar/recargar**:
   - cantidad=5, adicional=0, dctos=0, total=5 ❌ (consolidado incorrectamente)

## Evidencia del Problema

### Logs del Frontend (Firefox)
```
💾 Guardando producto: AREPA TIPO OBLEA 500Gr
Object { cantidad: 30, dctos: 0, adicional: 0 }  ← ❌ Adicional ya está en 0

🔍 ID1 - AREPA TIPO OBLEA 500Gr: Cantidad=50, Adicional=0, Total=50  ← ❌ Consolidado
```

### Base de Datos (Confirmado)
```json
{
  "producto": "AREPA TIPO OBLEA 500Gr",
  "cantidad": 50,  ← ❌ Debería ser 30 o 20
  "adicional": 0,  ← ❌ Debería ser 10 o 20
  "dctos": 0,
  "total": 50
}
```

## Flujo del Problema

```
1. App Móvil envía:
   cantidad=10, adicional=0, dctos=0

2. Frontend CRM carga:
   cantidad=10, adicional=0, dctos=0 ✅

3. Usuario escribe adicional=10:
   cantidad=10, adicional=10, dctos=0 ✅ (en memoria)

4. Se guarda en backend:
   cantidad=20, adicional=0, dctos=0 ❌ (consolidado)

5. Se recarga desde backend:
   cantidad=20, adicional=0, dctos=0 ❌ (permanece consolidado)
```

## Archivos Involucrados

### Frontend
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
  - Línea 699-780: Función `actualizarProducto` - Maneja cambios en inputs
  - Línea 38-65: Función `recalcularTotales` - Recalcula totales
  - Línea 420-500: Función `cargarDatosGuardados` - Carga datos desde backend
  - Línea 840-880: useEffect que guarda datos automáticamente

- `frontend/src/services/cargueApiService.js`
  - Línea 320-400: Función `guardarDatos` - Guarda en backend con debounce

- `frontend/src/services/cargueService.js`
  - Línea 251-400: Función `guardarCargueCompleto` - Mapea y guarda productos

### Backend
- `api/views.py`
  - Línea 2227-2320: Función `guardar_sugerido` - Recibe datos desde app móvil

## Análisis Técnico

### Código que Funciona Correctamente

**Cálculo de TOTAL (correcto):**
```javascript
// PlantillaOperativa.jsx línea 732
updated.total = cantidad - dctos + adicional - devoluciones - vencidas;
```

**Mapeo para guardar (correcto):**
```javascript
// cargueService.js línea 280
cantidad: producto.cantidad || 0,
dctos: producto.dctos || 0,
adicional: producto.adicional || 0,
```

### Posibles Causas

1. **Hipótesis 1**: Hay código oculto que consolida valores antes de guardar
2. **Hipótesis 2**: La función `recalcularTotales` está siendo llamada con datos incorrectos
3. **Hipótesis 3**: Hay un listener o evento que modifica CANTIDAD cuando cambia ADICIONAL/DCTOS
4. **Hipótesis 4**: El problema está en cómo se cargan los datos desde el backend y se aplican a `productosOperativos`

## Estado Actual

### Acciones Tomadas
1. ✅ Revisado código de cálculo de totales - Está correcto
2. ✅ Revisado código de mapeo para guardar - Está correcto
3. ✅ Confirmado problema en base de datos - Datos consolidados
4. ✅ Limpiada tabla `api_cargueid1` para empezar de nuevo

### Pendiente
1. ❌ Encontrar el código exacto que está consolidando los valores
2. ❌ Corregir la lógica para mantener cantidad, adicional y dctos independientes
3. ❌ Probar que los valores se mantienen después de guardar/recargar

## Información Adicional

### Contexto del Sistema
- **App Móvil (Guerrero)**: Envía solo CANTIDAD (sugerido del vendedor)
- **Frontend CRM-Fabrica**: Permite editar DCTOS, ADICIONAL, DEVOLUCIONES, VENCIDAS
- **Campo CANTIDAD**: Ahora es de solo lectura en el frontend (solo se modifica desde app)
- **Cálculo TOTAL**: `cantidad - dctos + adicional - devoluciones - vencidas`

### Navegadores Probados
- **Chrome**: Muestra estado "ALISTAMIENTO ACTIVO"
- **Firefox**: Muestra estado "SUGERIDO"
- **Nota**: Cada navegador tiene su propio localStorage independiente

### Logs Importantes a Revisar
```javascript
// Buscar en consola del navegador:
"💾 Guardando producto:"  // Ver qué valores se están guardando
"🔍 ID1 -"                // Ver qué valores se están cargando
"🧮 Cálculo total para"   // Ver cómo se calculan los totales
```

## Próximos Pasos Sugeridos

1. **Agregar logs detallados** en `actualizarProducto` para ver exactamente cuándo cambia CANTIDAD
2. **Revisar todos los useEffect** que dependen de `productosOperativos`
3. **Buscar código que modifique** `productosOperativos` directamente sin pasar por `actualizarProducto`
4. **Verificar si hay algún código** que esté "normalizando" o "consolidando" datos al cargar desde backend
5. **Revisar la función** `cargarDatosGuardados` línea por línea para ver si modifica los valores

## Comandos Útiles

### Limpiar tabla de pruebas
```bash
echo "si" | python3 limpiar_tabla_cargueid1.py
```

### Ver datos en base de datos
```bash
curl "http://localhost:8000/api/cargue-id1/?fecha=2025-11-24" | python3 -m json.tool
```

### Limpiar localStorage del navegador
```javascript
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('cargue_') || key.startsWith('estado_boton_')) {
        localStorage.removeItem(key);
    }
});
```

## Contacto
- Usuario reportando: Usuario del sistema CRM-Fabrica
- Fecha: 24 de noviembre de 2025
- Módulo afectado: Cargue (frontend/src/components/Cargue/)
