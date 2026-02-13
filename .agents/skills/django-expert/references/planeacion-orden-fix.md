# Fix Crítico: Planeación - Orden Visual vs Cantidad de Producción

## Fecha: 2026-02-11
## Archivos Modificados:
- `frontend/src/components/inventario/InventarioPlaneacion.jsx`
- `frontend/src/components/Cargue/BotonLimpiar.jsx`
- `frontend/src/components/Pos/ProductList.jsx`

---

## 🚨 Problema Original

### Contexto
En el módulo de **Planeación** (`/#/inventario`), el campo `orden` se usaba para **DOS cosas diferentes**:
1. **Posición visual** en la lista (1, 2, 3... viene del módulo Productos/Kardex)
2. **Cantidad a producir** (500, 300, 100... lo que el jefe escribe manualmente)

### Síntomas
- Las casillas de "ORDEN" mostraban números secuenciales (1, 2, 3, 4...) en lugar de las cantidades de producción (500, 300, 100...)
- Al abrir un día nuevo, las casillas NO estaban en cero. Mostraban los números de posición.
- Los datos de producción originales quedaron sobrescritos visualmente.

### Causa Raíz
Se modificó `InventarioPlaneacion.jsx` para priorizar `p.orden` (posición del producto en Kardex) sobre `planeacionGuardada.orden` (cantidad a producir del snapshot). Esto causó que:
1. El campo `orden` del objeto producto se llenara con la **posición** (1, 2, 3...) en vez de la **cantidad** (500, 300...).
2. El auto-guardado (`guardarEnBD`) sincronizó esos valores incorrectos a la base de datos.
3. `BotonLimpiar.jsx` también tenía el mismo problema al guardar snapshots.

---

## ✅ Solución Implementada

### 1. Separación de conceptos en `InventarioPlaneacion.jsx`

**Nuevo campo `ordenVisual`** (posición) separado de `orden` (cantidad):

```javascript
// 1. Cantidad a producir (Input editable): Viene del snapshot. Si no hay, es 0.
let cantidadOrdenada = planeacionGuardada ? (planeacionGuardada.orden || 0) : 0;

// 2. Posición Visual (Orden de lista): Viene del maestro de Productos (Kardex).
let ordenVisual = p.orden > 0 ? p.orden : 9999;

return {
  id: p.id,
  nombre: p.nombre,
  existencias: existencias,
  solicitado: solicitadoFinal,
  pedidos: pedidosProducto,
  orden: cantidadOrdenada,   // ✅ CANTIDAD a producir (input editable)
  ordenVisual: ordenVisual,  // 🆕 Posición para ordenar la lista
  ia: ia
};
```

**El sort usa `ordenVisual`** (NO `orden`):
```javascript
productosConPlaneacion.sort((a, b) => {
  const ordenA = a.ordenVisual !== undefined ? a.ordenVisual : 999999;
  const ordenB = b.ordenVisual !== undefined ? b.ordenVisual : 999999;
  if (ordenA !== ordenB) return ordenA - ordenB;
  return (a.id || 0) - (b.id || 0);
});
```

### 2. Rescate de datos desde Reporte Histórico

Se agregó un mecanismo de recuperación que lee del endpoint `/reportes-planeacion/`:

```javascript
// 🛡️ RECOVERY FIX: Cargar desde Reporte Histórico (Snapshot inmutable)
let reporteData = [];
try {
    const repResponse = await fetch(`${API_URL}/reportes-planeacion/?fecha=${fechaFormateada}`);
    if (repResponse.ok) {
        reporteData = await repResponse.json();
    }
} catch (e) { /* ... */ }

// Sobrescribir datos corruptos con datos del reporte (si existe)
if (reporteData.length > 0) {
    const reporte = reporteData[0];
    if (reporte.datos_json) {
        let productosReporte = typeof reporte.datos_json === 'string' 
            ? JSON.parse(reporte.datos_json) 
            : reporte.datos_json;
        
        productosReporte.forEach(item => {
            if (item.orden > 0) {
                if (!planeacionMap[item.nombre]) planeacionMap[item.nombre] = {};
                planeacionMap[item.nombre].orden = item.orden;
                if (item.ia > 0) planeacionMap[item.nombre].ia = item.ia;
            }
        });
    }
}
```

**¿Por qué funciona?**
El Reporte Histórico (botón verde "Guardado") es una **foto inmutable** de los datos al momento de congelar. No se ve afectado por cambios posteriores en la tabla de planeación.

### 3. Corrección en `BotonLimpiar.jsx`

Mismo principio: separar `orden` (cantidad) de `ordenVisual` (posición):

```javascript
registros.push({
  producto_nombre: nombreProducto,
  existencias: existencias,
  solicitadas: solicitadas,
  pedidos: pedidos,
  total: solicitadas + pedidos,
  orden: planeacionInfo.orden > 0 ? planeacionInfo.orden : 0, // ✅ CANTIDAD
  ordenVisual: ordenDeBD, // 🆕 Posición visual
  ia: planeacionInfo.ia || 0
});

// Ordenar por posición visual (Kardex), NO por cantidad
registros.sort((a, b) => {
  if (a.ordenVisual !== b.ordenVisual) return a.ordenVisual - b.ordenVisual;
  return a.producto_nombre.localeCompare(b.producto_nombre);
});
```

### 4. Corrección de ordenamiento en POS (`ProductList.jsx`)

**Problema:** El POS ordenaba productos por ID en vez de por el campo `orden`.
**Solución:** Cambiar el sort:

```javascript
// ANTES (incorrecto):
.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// DESPUÉS (correcto):
.sort((a, b) => {
  const ordenA = a.orden !== undefined ? a.orden : 999999;
  const ordenB = b.orden !== undefined ? b.orden : 999999;
  if (ordenA !== ordenB) return ordenA - ordenB;
  return parseInt(a.id) - parseInt(b.id);
});
```

---

## 📊 Flujo de Datos - Entender la Diferencia

### Campo `orden` en el modelo `Producto` (BD)
- **Significado:** Posición visual del producto en la lista (1, 2, 3...)
- **Se configura en:** Módulo Productos (drag & drop o manual)
- **Se usa para:** Ordenar las filas en todas las vistas (Kardex, Planeación, POS, Pedidos)

### Campo `orden` en el modelo `Planeacion` / Snapshot (BD)
- **Significado:** Cantidad que el jefe ordena producir (500, 300, 100...)
- **Se configura en:** Módulo Planeación (el jefe escribe manualmente)
- **Se usa para:** Registrar la producción del día

### REGLA DE ORO:
> **NUNCA mezclar estos dos campos.** Siempre usar variables separadas:
> - `ordenVisual` → Posición (viene de `api_stock` / Producto.orden)
> - `orden` → Cantidad a producir (viene de Planeacion.orden o snapshot)

---

## 🔍 Endpoints Relevantes

| Endpoint | Datos | Uso |
|----------|-------|-----|
| `GET /api/stock/` | `orden` = posición visual | Ordenar listas |
| `GET /api/planeacion/?fecha=YYYY-MM-DD` | `orden` = cantidad producida | Input editable |
| `GET /api/reportes-planeacion/?fecha=YYYY-MM-DD` | `datos_json` = snapshot inmutable | Rescate de datos |

---

## ⚠️ Lecciones Aprendidas

1. **Un campo con el mismo nombre en diferentes modelos puede significar COSAS DISTINTAS.**
   - `Producto.orden` = posición (1, 2, 3...)
   - `Planeacion.orden` = cantidad (500, 300...)
   
2. **El auto-guardado puede propagar errores rápidamente.** Si un campo visual se llena incorrectamente y hay auto-sync, los datos corruptos se guardan en la BD en segundos.

3. **Los Reportes Históricos (snapshots inmutables) son la última línea de defensa.** Siempre mantener un mecanismo de "foto" que no se modifique.

4. **Probar SIEMPRE en producción (VPS) después de cambios en lógica de ordenamiento**, ya que el comportamiento puede diferir del entorno local por diferencias en caché y datos.

---

## 🚀 Comandos de Deploy

```bash
# En el VPS:
git pull origin main
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

## Commits Relacionados
- `Fix: Restaurar cantidad de producción y usar orden visual separado en Planeación`
- `Fix: Restaurar datos de producción y orden visual separados`
- `Fix: Separar orden visual de cantidad producción en BotonLimpiar`
- `Fix: Ordenar productos en POS por campo orden en vez de ID`
