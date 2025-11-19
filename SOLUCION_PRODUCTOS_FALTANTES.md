# Solución: Productos Faltantes en Kardex y Planeación

## 🔍 PROBLEMA IDENTIFICADO

**Antes:**
- Kardex y Planeación cargaban productos desde `/api/productos/`
- Filtraban por `ubicacion_inventario === 'PRODUCCION'`
- Si un producto nuevo no tenía ese campo, NO aparecía

**Resultado:**
- Productos nuevos no aparecían en Kardex ni Planeación
- Inconsistencia entre módulos

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cambio de Estrategia:
**Usar `api_stock` como fuente de verdad**

**Ventajas:**
1. ✅ `api_stock` se crea automáticamente al crear producto
2. ✅ Ya tiene filtro por `ubicacion=PRODUCCION` en el backend
3. ✅ Incluye nombre y descripción del producto
4. ✅ Garantiza consistencia entre Kardex y Planeación

---

## 📝 CAMBIOS REALIZADOS

### 1. Modelo Stock (`api/models.py`)
```python
class Stock(models.Model):
    producto = models.OneToOneField(Producto, ...)
    producto_nombre = models.CharField(max_length=255, blank=True)  # ✅ NUEVO
    producto_descripcion = models.TextField(blank=True, null=True)  # ✅ NUEVO
    cantidad_actual = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Auto-llenar nombre y descripción
        if self.producto:
            self.producto_nombre = self.producto.nombre
            self.producto_descripcion = self.producto.descripcion
        super().save(*args, **kwargs)
```

### 2. Kardex (`frontend/src/components/inventario/TablaKardex.jsx`)

**Antes:**
```javascript
// Cargaba productos y luego filtraba
const productosResponse = await fetch('/api/productos/');
const productosBD = await productosResponse.json();
const productosProduccion = productosBD.filter(p => 
  p.ubicacion_inventario === 'PRODUCCION'
);
```

**Después:**
```javascript
// 🎯 Usa api_stock directamente (ya filtrado por backend)
const stockResponse = await fetch('/api/stock/?ubicacion=PRODUCCION');
const stocksBD = await stockResponse.json();

const productosProduccion = stocksBD.map(s => ({
  id: s.producto_id,
  nombre: s.producto_nombre,
  descripcion: s.producto_descripcion,
  stock_total: s.cantidad_actual
}));
```

### 3. Planeación (`frontend/src/components/inventario/InventarioPlaneacion.jsx`)

**Antes:**
```javascript
// Cargaba 5 endpoints (productos + stock)
const [planeacionResponse, productosResponse, stockResponse, ...] = await Promise.all([...]);
const productosProduccion = productosFromBD.filter(p => 
  p.ubicacion_inventario === 'PRODUCCION'
);
```

**Después:**
```javascript
// 🎯 Solo carga 4 endpoints (stock reemplaza productos)
const [planeacionResponse, stockResponse, ...] = await Promise.all([...]);

const productosProduccion = stocksBD.map(s => ({
  id: s.producto_id,
  nombre: s.producto_nombre,
  descripcion: s.producto_descripcion,
  stock_total: s.cantidad_actual
}));
```

---

## 🎯 FLUJO ACTUALIZADO

```
┌─────────────────────────────────────────────────────────────┐
│                  CREAR PRODUCTO NUEVO                       │
│                                                             │
│  1. Usuario llena modal "Agregar Producto"                 │
│  2. Frontend → POST /api/productos/                         │
│  3. Backend crea producto en api_producto                   │
│  4. Backend AUTO-CREA registro en api_stock ✅              │
│     - producto_nombre = producto.nombre                     │
│     - producto_descripcion = producto.descripcion           │
│     - cantidad_actual = producto.stock_total                │
│  5. Producto aparece INMEDIATAMENTE en:                     │
│     ✅ Kardex (usa api_stock)                               │
│     ✅ Planeación (usa api_stock)                           │
│     ✅ POS (usa api_productos)                              │
│     ✅ Pedidos (usa api_productos)                          │
│     ✅ Cargue (usa api_productos)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 TESTING

### Verificar que funciona:

1. **Crear producto nuevo:**
   - Ir a http://localhost:3000/productos
   - Click "Agregar Producto"
   - Llenar formulario y guardar

2. **Verificar en api_stock:**
   ```bash
   curl http://localhost:8000/api/stock/ | jq '.[] | select(.producto_nombre | contains("NOMBRE_PRODUCTO"))'
   ```

3. **Verificar en Kardex:**
   - Ir a http://localhost:3000/inventario (pestaña Kardex)
   - Buscar el producto nuevo
   - Debe aparecer con stock correcto

4. **Verificar en Planeación:**
   - Ir a http://localhost:3000/inventario (pestaña Planeación)
   - Buscar el producto nuevo
   - Debe aparecer con existencias correctas

---

## 📊 BENEFICIOS

1. ✅ **Consistencia:** Kardex y Planeación siempre muestran los mismos productos
2. ✅ **Automatización:** No requiere configuración manual de `ubicacion_inventario`
3. ✅ **Performance:** Una consulta menos (no necesita `/api/productos/`)
4. ✅ **Mantenibilidad:** `api_stock` es la única fuente de verdad para stock
5. ✅ **Escalabilidad:** Fácil agregar más campos a `api_stock`

---

## ⚠️ IMPORTANTE

### Ejecutar migraciones:
```bash
# 1. Crear migración para nuevos campos
python3 manage.py makemigrations

# 2. Aplicar migración
python3 manage.py migrate

# 3. Actualizar registros existentes
python3 actualizar_stock_descripcion.py
```

### Verificar en Admin:
- Ir a http://localhost:8000/admin/api/stock/
- Verificar que todos los productos tienen nombre y descripción

---

## 🎉 RESULTADO FINAL

Ahora **TODOS** los productos que están en `api_stock` aparecen en:
- ✅ Kardex
- ✅ Planeación

Y se crean automáticamente al crear un producto nuevo desde cualquier módulo.
