# Resumen de Cambios - Sistema de Stock

## ✅ COMPLETADO

### FASE 1: Limpieza de Productos Huérfanos
- **Script:** `limpiar_huerfanos.py`
- **Resultado:** 7 productos huérfanos eliminados
- **Productos eliminados:**
  - ALMOJABANAS X10
  - ALMOJABANAS X5
  - AREPA BOYACENSE X10
  - AREPA BOYACENSE X5
  - AREPA SANTADERANA
  - ENVUELTO DE MAIZ X 5 UND
  - MUTE BOYACENSE

### FASE 2: Creación de Modelo Stock

#### 1. Modelo (`api/models.py`)
```python
class Stock(models.Model):
    producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='stock', primary_key=True)
    cantidad_actual = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

**Características:**
- Relación OneToOne con Producto
- Campo `cantidad_actual` para stock en tiempo real
- Auto-actualización de `fecha_actualizacion`
- Tabla: `api_stock`

#### 2. Property en Producto
```python
@property
def stock_actual(self):
    try:
        return self.stock.cantidad_actual
    except:
        return self.stock_total or 0
```

#### 3. Serializer (`api/serializers.py`)
```python
class StockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
```

**Campos expuestos:**
- `producto` (ID)
- `producto_id` (read-only)
- `producto_nombre` (read-only)
- `cantidad_actual`
- `fecha_actualizacion` (read-only)

#### 4. ViewSet (`api/views.py`)
```python
class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('producto').all()
    serializer_class = StockSerializer
```

**Filtros disponibles:**
- `?producto_id=1` - Filtrar por producto específico
- `?ubicacion=PRODUCCION` - Filtrar por ubicación de inventario

**Ordenamiento:**
- Por `producto.orden` y `producto.id`

#### 5. URL (`api/urls.py`)
```python
router.register(r'stock', StockViewSet, basename='stock')
```

**Endpoint:** `/api/stock/`

#### 6. Admin (`api/admin.py`)
```python
@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('producto', 'cantidad_actual', 'fecha_actualizacion')
```

#### 7. Script de Migración (`migrar_stock.py`)
- Migra `stock_total` de Producto a `cantidad_actual` en Stock
- Crea registros para todos los productos existentes
- Muestra resumen de migración

---

## 🎯 ENDPOINTS DISPONIBLES

### GET /api/stock/
Lista todos los stocks
```json
[
  {
    "producto": 1,
    "producto_id": 1,
    "producto_nombre": "AREPA TIPO OBLEA 500Gr",
    "cantidad_actual": 150,
    "fecha_actualizacion": "2025-11-18T10:30:00Z"
  }
]
```

### GET /api/stock/?producto_id=1
Stock de un producto específico

### GET /api/stock/?ubicacion=PRODUCCION
Stocks de productos de PRODUCCION

### GET /api/productos/
Ahora incluye campo `stock_actual`
```json
{
  "id": 1,
  "nombre": "AREPA TIPO OBLEA 500Gr",
  "stock_total": 150,
  "stock_actual": 150,
  ...
}
```

---

## 📋 PRÓXIMOS PASOS

### FASE 3: Actualizar Lógica de Movimientos
Cuando se cree un movimiento de inventario, actualizar `api_stock`:

```python
# En RegistroInventarioViewSet.create()
Stock.objects.update_or_create(
    producto=producto,
    defaults={'cantidad_actual': producto.stock_total}
)
```

### FASE 4: Actualizar Frontend

#### Kardex (`frontend/src/components/inventario/TablaKardex.jsx`)
**Antes:**
```javascript
existencias: producto.stock_total || 0
```

**Después:**
```javascript
const stockResponse = await fetch(`${API_URL}/stock/?producto_id=${producto.id}`);
const stockData = await stockResponse.json();
existencias: stockData[0]?.cantidad_actual || 0
```

#### Planeación (`frontend/src/components/inventario/InventarioPlaneacion.jsx`)
**Antes:**
```javascript
existencias: p.stock_total || 0
```

**Después:**
```javascript
// Cargar stocks en paralelo
const stocksResponse = await fetch(`${API_URL}/stock/?ubicacion=PRODUCCION`);
const stocks = await stocksResponse.json();
const stockMap = {};
stocks.forEach(s => stockMap[s.producto_id] = s.cantidad_actual);

// Usar en productos
existencias: stockMap[p.id] || 0
```

#### POS y Pedidos
Usar `producto.stock_actual` directamente del endpoint `/api/productos/`

---

## 🔍 VENTAJAS DEL NUEVO SISTEMA

1. **Performance:** Una consulta directa a `api_stock` vs sumar todos los movimientos
2. **Consistencia:** Stock centralizado en una tabla
3. **Trazabilidad:** `fecha_actualizacion` automática
4. **Escalabilidad:** Fácil agregar campos (stock_reservado, stock_minimo, etc.)
5. **Mantenibilidad:** Código más limpio y organizado

---

## ⚠️ CONSIDERACIONES

1. **Migración:** Ejecutar `migrar_stock.py` después de crear la tabla
2. **Sincronización:** Mantener `stock_total` y `cantidad_actual` sincronizados
3. **Transacciones:** Usar transacciones atómicas para actualizaciones
4. **Cache:** Frontend puede cachear stocks con timestamp

---

## 📊 ESTADO ACTUAL

- ✅ Modelo Stock creado
- ✅ Serializer creado
- ✅ ViewSet creado
- ✅ URL registrada
- ✅ Admin configurado
- ✅ Script de migración listo
- ⏳ Migraciones pendientes (makemigrations + migrate)
- ⏳ Migración de datos pendiente
- ⏳ Actualización de frontend pendiente

---

## 🚀 COMANDOS PARA EJECUTAR

```bash
# 1. Crear migraciones
python3 manage.py makemigrations

# 2. Aplicar migraciones
python3 manage.py migrate

# 3. Migrar datos
python3 migrar_stock.py

# 4. Verificar
python3 manage.py runserver
# Ir a http://localhost:8000/admin/ y verificar "Stocks"
```
