# 🔧 Solución: Descuentos Duplicados en Base de Datos

## ❌ Problema Identificado

Cuando se guardaban los datos de Cargue, los **descuentos se duplicaban** en la base de datos.

### Ejemplo del Problema:
- Usuario escribe: **$450,000** en DESCUENTOS (concepto: gasolina)
- Base de datos muestra: **$500,000** o más

### Causa Raíz:
Los datos de **pagos** (concepto, descuentos, nequi, daviplata) se estaban guardando en **TODOS los registros de productos**, no solo en uno.

```javascript
// ❌ ANTES: Se guardaba en TODOS los productos
for (const producto of productos) {
  const datosTransformados = {
    producto: producto.nombre,
    cantidad: producto.cantidad,
    // ... otros campos del producto
    
    // ❌ PROBLEMA: Esto se repetía en CADA producto
    concepto: 'gasolina',
    descuentos: 450000,  // Se guardaba 10 veces si hay 10 productos
    nequi: 0,
    daviplata: 0
  };
}
```

### Resultado:
Si había 10 productos con cantidad > 0:
- Se guardaban 10 registros
- Cada uno con descuentos: $450,000
- Al cargar y sumar: $450,000 × 10 = **$4,500,000** 😱

---

## ✅ Solución Implementada

### 1. **Guardar datos de pagos SOLO en el primer producto**

**Archivo**: `frontend/src/services/cargueService.js`

```javascript
// ✅ AHORA: Solo en el primer producto
for (let index = 0; index < productos.length; index++) {
  const producto = productos[index];
  const esPrimerProducto = index === 0;
  
  const datosTransformados = {
    producto: producto.nombre,
    cantidad: producto.cantidad,
    // ... otros campos del producto
    
    // ✅ SOLUCIÓN: Solo en el primer producto
    ...(esPrimerProducto && datosParaGuardar.pagos && {
      concepto: datosParaGuardar.pagos.concepto || '',
      descuentos: datosParaGuardar.pagos.descuentos || 0,
      nequi: datosParaGuardar.pagos.nequi || 0,
      daviplata: datosParaGuardar.pagos.daviplata || 0
    }),
  };
}
```

### 2. **Cargar datos de pagos SOLO del primer registro**

**Archivo**: `frontend/src/components/Cargue/ResumenVentas.jsx`

```javascript
// ✅ AHORA: Solo tomar el primer registro con datos
if ((tieneConcepto || tieneMontos) && conceptosMap.size === 0) {
  // Solo tomar el primer registro con datos de pagos
  conceptosMap.set('PAGOS', {
    concepto: item.concepto || '',
    descuentos: parseFloat(item.descuentos) || 0,
    nequi: parseFloat(item.nequi) || 0,
    daviplata: parseFloat(item.daviplata) || 0
  });
}
```

### 3. **Aplicar la misma lógica a Resumen y Cumplimiento**

También se corrigió para:
- `base_caja`
- `total_despacho`
- `total_pedidos`
- `total_dctos`
- `venta`
- `total_efectivo`
- Todos los campos de cumplimiento

---

## 📊 Comparación

### Antes (Duplicación)
```
Registro 1: AREPA OBLEA 500GR
  - cantidad: 10
  - concepto: gasolina
  - descuentos: 450000  ← Se guarda aquí

Registro 2: AREPA MEDIANA 330GR
  - cantidad: 5
  - concepto: gasolina
  - descuentos: 450000  ← Se guarda aquí también

Registro 3: AREPA PINCHO 330GR
  - cantidad: 8
  - concepto: gasolina
  - descuentos: 450000  ← Y aquí también

... (7 productos más)

TOTAL AL CARGAR: 450000 × 10 = 4,500,000 ❌
```

### Ahora (Sin Duplicación)
```
Registro 1: AREPA OBLEA 500GR (PRIMER PRODUCTO)
  - cantidad: 10
  - concepto: gasolina
  - descuentos: 450000  ← Solo aquí ✅

Registro 2: AREPA MEDIANA 330GR
  - cantidad: 5
  - concepto: null
  - descuentos: 0  ← Vacío

Registro 3: AREPA PINCHO 330GR
  - cantidad: 8
  - concepto: null
  - descuentos: 0  ← Vacío

... (7 productos más con descuentos = 0)

TOTAL AL CARGAR: 450000 ✅
```

---

## 🔧 Archivos Modificados

### 1. `frontend/src/services/cargueService.js`
**Líneas modificadas**: ~260-320

**Cambios**:
- Agregado `esPrimerProducto` flag
- Datos de pagos solo se guardan si `esPrimerProducto === true`
- Datos de resumen solo se guardan si `esPrimerProducto === true`
- Datos de cumplimiento solo se guardan si `esPrimerProducto === true`

### 2. `frontend/src/components/Cargue/ResumenVentas.jsx`
**Líneas modificadas**: ~95-115

**Cambios**:
- Solo toma el primer registro con datos de pagos
- Usa `conceptosMap.size === 0` para asegurar que solo se tome uno
- No suma múltiples registros

---

## 🧪 Cómo Probar

### Test 1: Guardar Nuevos Datos
1. Abrir Cargue para un día específico
2. Agregar productos con cantidades
3. En Resumen, escribir:
   - Concepto: gasolina
   - Descuentos: $450,000
4. Guardar (activar ALISTAMIENTO)
5. Verificar en BD que solo hay **1 registro** con descuentos = 450000

### Test 2: Cargar Datos Guardados
1. Recargar la página
2. Abrir el mismo día
3. Verificar que en Resumen muestra:
   - Concepto: gasolina
   - Descuentos: $450,000 (no $4,500,000)

### Test 3: Verificar en Base de Datos
```sql
-- Consultar registros con descuentos
SELECT producto, concepto, descuentos 
FROM api_cargueid1 
WHERE fecha = '2025-08-09' 
AND descuentos > 0;

-- Resultado esperado: Solo 1 registro con descuentos > 0
```

---

## ⚠️ Datos Existentes

### Problema con Datos Antiguos
Si ya tienes datos guardados con el bug anterior, tendrás registros duplicados en la BD.

### Solución para Limpiar:
```sql
-- Opción 1: Eliminar registros duplicados (mantener solo el primero)
DELETE FROM api_cargueid1 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM api_cargueid1 
  GROUP BY fecha, dia
);

-- Opción 2: Poner descuentos en 0 excepto el primer registro
UPDATE api_cargueid1 
SET descuentos = 0, nequi = 0, daviplata = 0, concepto = ''
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM api_cargueid1 
  GROUP BY fecha, dia
);
```

**⚠️ IMPORTANTE**: Hacer backup antes de ejecutar estos comandos!

---

## ✅ Beneficios

### 1. **Datos Correctos** 📊
- Los descuentos ya no se duplican
- Los valores en BD coinciden con lo que el usuario escribió

### 2. **Menor Uso de Espacio** 💾
- Menos datos redundantes en BD
- Campos vacíos en lugar de duplicados

### 3. **Carga Más Rápida** ⚡
- No necesita sumar múltiples registros
- Solo lee el primer registro con datos

### 4. **Más Mantenible** 🔧
- Lógica más clara
- Menos confusión sobre dónde están los datos

---

## 📝 Notas Técnicas

### Estructura de Datos

**Antes**:
```json
[
  { "producto": "AREPA OBLEA", "descuentos": 450000 },
  { "producto": "AREPA MEDIANA", "descuentos": 450000 },
  { "producto": "AREPA PINCHO", "descuentos": 450000 }
]
```

**Ahora**:
```json
[
  { "producto": "AREPA OBLEA", "descuentos": 450000 },  // Solo aquí
  { "producto": "AREPA MEDIANA", "descuentos": 0 },
  { "producto": "AREPA PINCHO", "descuentos": 0 }
]
```

### Campos Afectados

Todos estos campos ahora solo se guardan en el **primer producto**:
- `concepto`
- `descuentos`
- `nequi`
- `daviplata`
- `base_caja`
- `total_despacho`
- `total_pedidos`
- `total_dctos`
- `venta`
- `total_efectivo`
- `licencia_transporte`
- `soat`
- `uniforme`
- `no_locion`
- `no_accesorios`
- `capacitacion_carnet`
- `higiene`
- `estibas`
- `desinfeccion`

---

## 🚀 Próximos Pasos

### Recomendaciones:

1. **Limpiar datos antiguos** (opcional)
   - Ejecutar script SQL para eliminar duplicados
   - O dejar que se sobrescriban naturalmente

2. **Monitorear logs**
   - Verificar que solo se guarda en el primer producto
   - Buscar mensajes: `💾 Guardando producto: [nombre]`

3. **Probar exhaustivamente**
   - Guardar y cargar datos varias veces
   - Verificar que los valores coinciden

---

**Fecha de corrección**: 19/11/2025  
**Versión**: 1.3.0  
**Estado**: ✅ CORREGIDO - Sin Duplicación
