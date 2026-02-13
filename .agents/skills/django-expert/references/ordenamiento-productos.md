# Ordenamiento de Productos - Guía de Referencia

## Fecha: 2026-02-11
## Aplica a: POS, Pedidos, Planeación, Kardex

---

## 📋 Resumen

El campo `orden` del modelo `Producto` controla la **posición visual** en todas las listas del sistema. Este campo se configura desde el módulo **Productos** y debe ser respetado en TODOS los módulos.

---

## 🔧 Dónde se ordena en cada módulo

### 1. POS (`ProductList.jsx`)
**Archivo:** `frontend/src/components/Pos/ProductList.jsx`
**Línea:** ~83
```javascript
.sort((a, b) => {
  const ordenA = a.orden !== undefined ? a.orden : 999999;
  const ordenB = b.orden !== undefined ? b.orden : 999999;
  if (ordenA !== ordenB) return ordenA - ordenB;
  return parseInt(a.id) - parseInt(b.id);
});
```

### 2. Planeación (`InventarioPlaneacion.jsx`)
**Archivo:** `frontend/src/components/inventario/InventarioPlaneacion.jsx`
**Usa:** Campo `ordenVisual` (separado de `orden` que es cantidad a producir)
```javascript
productosConPlaneacion.sort((a, b) => {
  const ordenA = a.ordenVisual !== undefined ? a.ordenVisual : 999999;
  const ordenB = b.ordenVisual !== undefined ? b.ordenVisual : 999999;
  if (ordenA !== ordenB) return ordenA - ordenB;
  return (a.id || 0) - (b.id || 0);
});
```

### 3. Pedidos
**Ya funciona correctamente** - usa el orden del contexto unificado.

### 4. Kardex / Inventario
**Ya funciona correctamente** - usa `api_stock` que trae el campo `orden`.

### 5. Contexto Unificado (`UnifiedProductContext.jsx`)
**Archivo:** `frontend/src/context/UnifiedProductContext.jsx`
**Línea:** ~98
- Los productos se ordenan automáticamente al cargar.
- Todos los módulos que usan `useProducts()` o `useProductos()` reciben los productos ya ordenados.

---

## ⚠️ REGLA CRÍTICA: Doble significado de "orden"

| Modelo | Campo | Significado | Ejemplo |
|--------|-------|-------------|---------|
| `Producto` | `orden` | Posición visual en lista | 1, 2, 3, 4... |
| `Planeacion` | `orden` | Cantidad a producir | 500, 300, 100... |

**NUNCA confundir estos dos.** En Planeación se usan variables separadas:
- `ordenVisual` → posición (de Producto.orden)
- `orden` (o `cantidadOrdenada`) → cantidad a producir (de Planeacion.orden)

---

## 🔄 Fuente de verdad para el orden

1. **Backend:** `api/models.py` → `Producto.orden` (IntegerField)
2. **API:** `GET /api/stock/` → cada producto tiene campo `orden`
3. **Frontend Context:** `UnifiedProductContext.jsx` → ordena al cargar
4. **Cada módulo:** Debe respetar el orden del contexto o re-ordenar por `orden`

---

## 📝 Checklist: Agregar un nuevo módulo con listado de productos

- [ ] Usar `useProducts()` o `useProductos()` del contexto unificado
- [ ] Si aplicas `.sort()`, usar el campo `orden` (NO `id`)
- [ ] Si el módulo tiene su propio campo `orden` (como Planeación), separar en `ordenVisual`
- [ ] Verificar en VPS después de deploy (puede haber diferencias con local)
