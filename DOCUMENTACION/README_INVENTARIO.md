# 📊 Módulo INVENTARIO

## 📋 Descripción General

El módulo INVENTARIO gestiona el stock de productos, movimientos de entrada/salida, lotes, vencimientos y planeación de producción. Permite visualizar el inventario por ubicación (Producción/Maquila), mantener un kardex (historial de movimientos) y realizar trazabilidad de productos.

---

## 🎯 Funcionalidades Principales

### 1. Visualización de Stock
- Stock por ubicación (Producción/Maquila)
- Stock total por producto
- Alertas de stock bajo
- Productos sin stock
- Filtrado por categoría

### 2. Movimientos de Inventario
- Entrada de producción
- Salida por venta
- Ajustes manuales
- Registro de usuario y fecha
- Notas y observaciones

### 3. Gestión de Lotes
- Registro de lotes por fecha
- Fecha de vencimiento
- Lotes vencidos
- Historial de lotes
- Motivos de vencimiento (hongo, fvto, sellado)

### 4. Kardex (Trazabilidad de Movimientos)
- Historial completo de movimientos por producto
- Filtrado por producto, tipo, fecha
- Saldos acumulados
- Usuario responsable de cada movimiento
- Trazabilidad completa desde entrada hasta salida
- Seguimiento de lotes

### 5. Planeación de Producción
- Existencias actuales
- Solicitadas (de pedidos)
- Pedidos pendientes
- Sugerencia de producción
- Proyección de demanda

---

## 🏗️ Estructura de Componentes Frontend

### Componentes Principales

```
frontend/src/components/inventario/
├── InventarioProduccion.jsx        # Inventario de producción
├── InventarioMaquila.jsx           # Inventario de maquila
├── InventarioPlaneacion.jsx        # Planeación de producción
├── TablaInventario.jsx             # Tabla de stock
├── TablaKardex.jsx                 # Tabla de movimientos
├── TablaMovimientos.jsx            # Movimientos recientes
├── TablaMaquilas.jsx               # Tabla de maquilas
├── TablaConfirmacionProduccion.jsx # Confirmación de producción
├── ModalAgregarProducto.jsx        # Agregar producto
├── ModalEditarCantidades.jsx       # Editar cantidades
├── ModalEditarExistencias.jsx      # Editar existencias
├── ModalEditarMaquilas.jsx         # Editar maquilas
└── ModalCambiarUsuario.jsx         # Cambiar usuario
```

---

## 💾 Modelos de Datos Backend

### Modelo: Producto
```python
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    orden = models.IntegerField(default=0)
    ubicacion_inventario = models.CharField(
        max_length=20,
        choices=[('PRODUCCION', 'Producción'), ('MAQUILA', 'Maquila')],
        default='PRODUCCION'
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)
```

### Modelo: MovimientoInventario
```python
class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(default=timezone.now)
    usuario = models.CharField(max_length=100)
    nota = models.TextField(blank=True, null=True)
    
    def save(self):
        # Actualizar stock del producto
        if self.tipo == 'ENTRADA':
            self.producto.stock_total += self.cantidad
        elif self.tipo == 'SALIDA':
            self.producto.stock_total -= self.cantidad
        
        self.producto.save()
        super().save()
```

### Modelo: Lote
```python
class Lote(models.Model):
    lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    usuario = models.CharField(max_length=100, default='Sistema')
    fecha_produccion = models.DateField(default='2025-06-17')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

### Modelo: Planeacion
```python
class Planeacion(models.Model):
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    usuario = models.CharField(max_length=100)
    
    def save(self):
        # Calcular total automáticamente
        self.total = self.existencias + self.solicitadas + self.pedidos
        super().save()
```

---

## 🔌 Endpoints API

### Listar Productos
```
GET /api/productos/?ubicacion_inventario=PRODUCCION&activo=true

Response:
[
  {
    "id": 1,
    "nombre": "Producto A",
    "stock_total": 100,
    "precio": 5000,
    "ubicacion_inventario": "PRODUCCION",
    "activo": true
  },
  ...
]
```

### Crear Movimiento
```
POST /api/movimientos-inventario/

Request:
{
  "producto": 1,
  "tipo": "ENTRADA",
  "cantidad": 50,
  "usuario": "Juan",
  "nota": "Entrada de producción"
}

Response:
{
  "id": 1,
  "producto": 1,
  "tipo": "ENTRADA",
  "cantidad": 50,
  "fecha": "2025-11-17T10:30:00Z",
  "usuario": "Juan"
}
```

### Actualizar Stock
```
POST /api/productos/{id}/actualizar_stock/

Request:
{
  "cantidad": 50,
  "usuario": "Juan",
  "nota": "Ajuste manual"
}

Response:
{
  "success": true,
  "stock_actual": 150
}
```

### Listar Movimientos
```
GET /api/movimientos-inventario/?producto=1&tipo=ENTRADA&fecha_inicio=2025-11-01

Response:
[
  {
    "id": 1,
    "producto": 1,
    "tipo": "ENTRADA",
    "cantidad": 50,
    "fecha": "2025-11-17T10:30:00Z",
    "usuario": "Juan",
    "nota": "Entrada de producción"
  },
  ...
]
```

### Listar Lotes
```
GET /api/lotes/?fecha_produccion=2025-11-17

Response:
[
  {
    "id": 1,
    "lote": "LOTE001",
    "fecha_vencimiento": "2025-12-17",
    "fecha_produccion": "2025-11-17",
    "usuario": "Juan"
  },
  ...
]
```

### Listar Planeación
```
GET /api/planeacion/?fecha=2025-11-17

Response:
[
  {
    "id": 1,
    "fecha": "2025-11-17",
    "producto_nombre": "Producto A",
    "existencias": 100,
    "solicitadas": 20,
    "pedidos": 10,
    "total": 130
  },
  ...
]
```

---

## 🔄 Flujo de Inventario Completo

### 1. Visualizar Stock
```javascript
// InventarioProduccion.jsx
const loadInventory = async () => {
  const response = await fetch(
    '/api/productos/?ubicacion_inventario=PRODUCCION&activo=true'
  );
  const productos = await response.json();
  setProductos(productos);
};
```

### 2. Registrar Entrada
```javascript
// ModalAgregarProducto.jsx
const handleAddEntry = async (productData) => {
  // Crear movimiento de ENTRADA
  const response = await fetch('/api/movimientos-inventario/', {
    method: 'POST',
    body: JSON.stringify({
      producto: productData.producto_id,
      tipo: 'ENTRADA',
      cantidad: productData.cantidad,
      usuario: productData.usuario,
      nota: productData.nota
    })
  });
  
  // Actualizar lista de productos
  loadInventory();
};
```

### 3. Registrar Salida
```javascript
// Automático cuando se crea una venta
// DetalleVenta.save() crea MovimientoInventario de tipo SALIDA
```

### 4. Ajuste Manual
```javascript
// ModalEditarCantidades.jsx
const handleAdjustment = async (productId, newQuantity) => {
  const currentProduct = productos.find(p => p.id === productId);
  const difference = newQuantity - currentProduct.stock_total;
  
  const response = await fetch('/api/movimientos-inventario/', {
    method: 'POST',
    body: JSON.stringify({
      producto: productId,
      tipo: 'AJUSTE',
      cantidad: difference,
      usuario: currentUser,
      nota: 'Ajuste manual'
    })
  });
};
```

### 5. Visualizar Kardex
```javascript
// TablaKardex.jsx
const loadKardex = async (productId) => {
  const response = await fetch(
    `/api/movimientos-inventario/?producto=${productId}`
  );
  const movimientos = await response.json();
  setMovimientos(movimientos);
};
```

### 6. Planeación de Producción
```javascript
// InventarioPlaneacion.jsx
const loadPlanning = async (date) => {
  const response = await fetch(`/api/planeacion/?fecha=${date}`);
  const planeacion = await response.json();
  setPlaneacion(planeacion);
};
```

---

## 📊 Servicios Frontend

### registroInventarioService.js
```javascript
export const registroInventarioService = {
  // Obtener inventario
  getInventario: async (ubicacion = 'PRODUCCION') => {
    return fetch(
      `/api/productos/?ubicacion_inventario=${ubicacion}&activo=true`
    ).then(r => r.json());
  },
  
  // Crear movimiento
  createMovimiento: async (movimientoData) => {
    return fetch('/api/movimientos-inventario/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimientoData)
    }).then(r => r.json());
  },
  
  // Obtener movimientos
  getMovimientos: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`/api/movimientos-inventario/?${params}`).then(r => r.json());
  },
  
  // Obtener lotes
  getLotes: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`/api/lotes/?${params}`).then(r => r.json());
  },
  
  // Obtener planeación
  getPlaneacion: async (fecha) => {
    return fetch(`/api/planeacion/?fecha=${fecha}`).then(r => r.json());
  }
};
```

---

## 🎨 Estilos Principales

### InventarioScreen.css
```css
.inventario-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.inventario-main {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.inventario-sidebar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #ddd;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tabla-inventario {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.tabla-inventario thead {
  background-color: #007bff;
  color: white;
}

.tabla-inventario th,
.tabla-inventario td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.tabla-inventario tbody tr:hover {
  background-color: #f9f9f9;
}

.stock-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.stock-badge.bajo {
  background-color: #ffc107;
  color: #333;
}

.stock-badge.critico {
  background-color: #dc3545;
  color: white;
}

.stock-badge.normal {
  background-color: #28a745;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.action-buttons button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.btn-edit {
  background-color: #007bff;
  color: white;
}

.btn-edit:hover {
  background-color: #0056b3;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}
```

---

## 🔐 Validaciones

### Validación de Movimiento
```javascript
const validateMovimiento = (movimientoData) => {
  if (!movimientoData.producto) {
    throw new Error('Debe seleccionar un producto');
  }
  
  if (!movimientoData.tipo) {
    throw new Error('Debe seleccionar un tipo de movimiento');
  }
  
  if (movimientoData.cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  
  if (movimientoData.tipo === 'SALIDA') {
    const producto = productos.find(p => p.id === movimientoData.producto);
    if (movimientoData.cantidad > producto.stock_total) {
      throw new Error('Stock insuficiente');
    }
  }
  
  return true;
};
```

---

## 📱 Pantalla Principal (InventarioScreen.jsx)

```javascript
import React, { useState, useEffect } from 'react';
import InventarioProduccion from '../components/inventario/InventarioProduccion';
import InventarioMaquila from '../components/inventario/InventarioMaquila';
import InventarioPlaneacion from '../components/inventario/InventarioPlaneacion';
import './InventarioScreen.css';

export default function InventarioScreen() {
  const [activeTab, setActiveTab] = useState('produccion');
  
  return (
    <div className="inventario-container">
      <div className="inventario-main">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'produccion' ? 'active' : ''}`}
            onClick={() => setActiveTab('produccion')}
          >
            📦 Producción
          </button>
          <button
            className={`tab ${activeTab === 'maquila' ? 'active' : ''}`}
            onClick={() => setActiveTab('maquila')}
          >
            🏭 Maquila
          </button>
          <button
            className={`tab ${activeTab === 'planeacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('planeacion')}
          >
            📊 Planeación
          </button>
        </div>
        
        {activeTab === 'produccion' && <InventarioProduccion />}
        {activeTab === 'maquila' && <InventarioMaquila />}
        {activeTab === 'planeacion' && <InventarioPlaneacion />}
      </div>
    </div>
  );
}
```

---

## 🔄 Integración con Otros Módulos

### Integración con POS
Cuando se crea una venta:
1. Se crea `MovimientoInventario` de tipo SALIDA
2. Se actualiza `stock_total` del producto
3. Se refleja en inventario disponible

### Integración con Cargue
Cuando se registra un cargue:
1. Se suma al `total_despacho`
2. Se actualiza planeación
3. Se refleja en stock disponible

### Integración con Pedidos
Cuando se crea un pedido:
1. Se suma a `solicitadas` en planeación
2. Se reserva stock
3. Se actualiza disponibilidad

---

## 📊 Reportes

### Reporte de Stock
```javascript
const generateStockReport = async () => {
  const productos = await registroInventarioService.getInventario();
  
  return {
    total_productos: productos.length,
    stock_total: productos.reduce((sum, p) => sum + p.stock_total, 0),
    valor_inventario: productos.reduce((sum, p) => sum + (p.stock_total * p.precio), 0),
    productos_sin_stock: productos.filter(p => p.stock_total === 0).length,
    productos_bajo_stock: productos.filter(p => p.stock_total < 10).length
  };
};
```

---

## 🚀 Optimizaciones

1. **Caché de Productos**: Se cachean los productos por ubicación
2. **Búsqueda Optimizada**: Búsqueda en cliente sin llamadas API
3. **Actualización en Tiempo Real**: Los cambios se reflejan inmediatamente
4. **Paginación**: Las tablas grandes se paginan

---

## 📝 Checklist de Implementación

- [ ] Crear componente InventarioScreen
- [ ] Implementar InventarioProduccion
- [ ] Crear InventarioMaquila
- [ ] Implementar InventarioPlaneacion
- [ ] Crear TablaInventario
- [ ] Implementar TablaKardex
- [ ] Crear ModalAgregarProducto
- [ ] Implementar ModalEditarCantidades
- [ ] Integrar con API de movimientos
- [ ] Agregar validaciones
- [ ] Crear reportes
- [ ] Optimizar rendimiento

---

**Última actualización**: 17 de Noviembre de 2025
