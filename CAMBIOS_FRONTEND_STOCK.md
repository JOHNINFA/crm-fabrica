# Cambios Frontend - Sistema de Stock

## ✅ ARCHIVOS ACTUALIZADOS

### 1. Kardex (`frontend/src/components/inventario/TablaKardex.jsx`)

#### Cambios realizados:

**Antes:**
```javascript
// Solo cargaba productos
const productosResponse = await fetch('http://localhost:8000/api/productos/');
const productosBD = await productosResponse.json();

// Usaba stock_total directamente
existencias: p.stock_total || 0
```

**Después:**
```javascript
// 🚀 CARGA PARALELA - Productos y Stock al mismo tiempo
const [productosResponse, stockResponse] = await Promise.all([
  fetch('http://localhost:8000/api/productos/'),
  fetch('http://localhost:8000/api/stock/?ubicacion=PRODUCCION')
]);

// Crear mapa de stocks
const stocksBD = stockResponse.ok ? await stockResponse.json() : [];
const stockMap = {};
stocksBD.forEach(s => {
  stockMap[s.producto_id] = s.cantidad_actual;
});

// Usar stock desde api_stock (prioridad) o stock_total (fallback)
existencias: stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stock_total || 0)
```

**Beneficios:**
- ✅ Stock en tiempo real desde tabla `api_stock`
- ✅ Carga paralela (más rápido)
- ✅ Fallback a `stock_total` si no hay registro en `api_stock`
- ✅ Filtrado por ubicación PRODUCCION

---

### 2. Planeación (`frontend/src/components/inventario/InventarioPlaneacion.jsx`)

#### Cambios realizados:

**Antes:**
```javascript
// Cargaba 4 endpoints
const [planeacionResponse, productosResponse, solicitadasResponse, pedidosResponse] = await Promise.all([
  fetch(`${API_URL}/planeacion/?fecha=${fechaFormateada}`),
  fetch(`${API_URL}/productos/`),
  fetch(`${API_URL}/produccion-solicitadas/?fecha=${fechaFormateada}`),
  fetch(`${API_URL}/pedidos/`)
]);

// Usaba stock_total
existencias: p.stock_total || 0
```

**Después:**
```javascript
// 🚀 Ahora carga 5 endpoints (incluye stock)
const [planeacionResponse, productosResponse, stockResponse, solicitadasResponse, pedidosResponse] = await Promise.all([
  fetch(`${API_URL}/planeacion/?fecha=${fechaFormateada}`),
  fetch(`${API_URL}/productos/`),
  fetch(`${API_URL}/stock/?ubicacion=PRODUCCION`),
  fetch(`${API_URL}/produccion-solicitadas/?fecha=${fechaFormateada}`),
  fetch(`${API_URL}/pedidos/`)
]);

// Procesar stocks
const stocksBD = stockResponse.ok ? await stockResponse.json() : [];
const stockMap = {};
stocksBD.forEach(s => {
  stockMap[s.producto_id] = s.cantidad_actual;
});

// Usar stock desde api_stock
const existencias = stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stock_total || 0);
```

**Beneficios:**
- ✅ Stock actualizado en tiempo real
- ✅ Carga paralela (no afecta performance)
- ✅ Consistencia con Kardex
- ✅ Fallback a `stock_total`

---

## 🎯 IMPACTO EN LA UI

### Kardex
- Muestra stock real desde `api_stock`
- Actualización cada 30 segundos (ya existente)
- Cache en localStorage (ya existente)

### Planeación
- Columna "Existencias" muestra stock real
- Se actualiza automáticamente cada 15 segundos (ya existente)
- Sincronización con eventos de otros módulos (ya existente)

---

## 📊 FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │   KARDEX     │              │  PLANEACIÓN  │           │
│  │              │              │              │           │
│  │ GET /stock/  │              │ GET /stock/  │           │
│  │ ?ubicacion=  │              │ ?ubicacion=  │           │
│  │  PRODUCCION  │              │  PRODUCCION  │           │
│  └──────┬───────┘              └──────┬───────┘           │
│         │                             │                    │
└─────────┼─────────────────────────────┼────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Django)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              StockViewSet                            │  │
│  │  - Filtra por ubicacion=PRODUCCION                   │  │
│  │  - Ordena por producto.orden                         │  │
│  │  - Retorna cantidad_actual                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tabla: api_stock                        │  │
│  │  - producto_id (FK)                                  │  │
│  │  - cantidad_actual                                   │  │
│  │  - fecha_actualizacion                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 TESTING

### Verificar Kardex:
1. Abrir http://localhost:3000/inventario (pestaña Kardex)
2. Verificar que muestra existencias correctas
3. Verificar que productos con stock negativo se muestran en rojo
4. Verificar que actualiza cada 30 segundos

### Verificar Planeación:
1. Abrir http://localhost:3000/inventario (pestaña Planeación)
2. Verificar columna "Existencias"
3. Verificar que coincide con Kardex
4. Verificar que actualiza cada 15 segundos

### Verificar Consistencia:
```bash
# En terminal, verificar que ambos usan el mismo stock
curl http://localhost:8000/api/stock/?ubicacion=PRODUCCION | jq '.[0]'
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Fallback:** Si `api_stock` no tiene registro, usa `stock_total` del producto
2. **Performance:** Carga paralela no afecta tiempos de respuesta
3. **Cache:** localStorage sigue funcionando igual
4. **Actualización:** Los intervalos de actualización no cambiaron

---

## 📋 PRÓXIMOS PASOS (OPCIONAL)

### POS y Pedidos
Si quieres actualizar también POS y Pedidos para usar `api_stock`:

**POS:** `frontend/src/components/Pos/ProductList.jsx`
**Pedidos:** `frontend/src/components/Pedidos/ProductList.jsx`

Cambiar de:
```javascript
stock: producto.stock_total
```

A:
```javascript
stock: producto.stock_actual  // Ya viene en el endpoint /api/productos/
```

---

## ✅ ESTADO ACTUAL

- ✅ Backend: Tabla `api_stock` creada y migrada
- ✅ Backend: Endpoint `/api/stock/` funcionando
- ✅ Frontend: Kardex actualizado
- ✅ Frontend: Planeación actualizado
- ⏳ Frontend: POS (opcional)
- ⏳ Frontend: Pedidos (opcional)

---

## 🎉 RESULTADO FINAL

El sistema ahora usa una tabla dedicada para stock en tiempo real, mejorando:
- **Performance:** Consultas más rápidas
- **Consistencia:** Stock centralizado
- **Mantenibilidad:** Código más limpio
- **Escalabilidad:** Fácil agregar funcionalidades
