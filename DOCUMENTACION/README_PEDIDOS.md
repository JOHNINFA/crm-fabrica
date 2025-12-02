# 📋 Módulo PEDIDOS

## 📋 Descripción General

El módulo PEDIDOS gestiona la creación, seguimiento y entrega de pedidos de clientes. Incluye gestión de clientes (información de contacto, datos geográficos, configuración), historial de pedidos, y seguimiento de estado. Integra con inventario para reservar stock, con planeación para actualizar solicitadas, y con cargue para registrar entregas.

---

## 🎯 Funcionalidades Principales

### 1. Creación de Pedidos
- Selección de cliente (o crear nuevo)
- Búsqueda y selección de productos
- Definición de cantidad y precio
- Fecha de entrega
- Tipo de pedido (normal, urgente, especial)
- Transportadora
- Notas especiales

### 2. Gestión de Clientes (Integrada en Pedidos)
- **Información Básica**: Nombre, identificación, tipo de persona
- **Datos de Contacto**: Teléfono, email, contacto
- **Datos Geográficos**: País, departamento, ciudad, dirección, zona/barrio
- **Configuración**: Régimen tributario, lista de precios, vendedor asignado
- **Saldos y Crédito**: Cupo de endeudamiento, días de vencimiento
- **Historial de Compras**: Registro de pedidos anteriores

### 3. Historial de Pedidos
- Seguimiento de estado (pendiente, confirmado, entregado, cancelado)
- Historial de cambios
- Notas y observaciones
- Asignación a vendedor
- Fecha de creación y actualización
- Información de entrega

### 4. Gestión de Entregas
- Confirmación de entrega
- Generación de remisión
- Registro de firma
- Actualización de estado
- Seguimiento de transportadora

### 5. Integración con Inventario
- Reserva de stock
- Actualización de disponibilidad
- Alertas de stock insuficiente
- Movimientos automáticos

### 6. Integración con Planeación
- Actualización de solicitadas
- Sugerencia de producción
- Seguimiento de demanda

---

## 🏗️ Estructura de Componentes Frontend

### Componentes Principales

```
frontend/src/components/Pedidos/
├── PedidosScreen.jsx              # Pantalla principal
├── ProductList.jsx                # Lista de productos
├── ProductCard.jsx                # Tarjeta de producto
├── Cart.jsx                       # Carrito de pedido
├── PaymentModal.jsx               # Modal de pago/términos
├── AddProductModal.jsx            # Modal para agregar productos
├── ProductsModal.jsx              # Modal de búsqueda
├── ConsumerForm.jsx               # Formulario de cliente
├── CategoryManager.jsx            # Gestor de categorías
├── LoginCajeroModal.jsx          # Login de vendedor
├── ModalDetallePedido.jsx        # Detalle del pedido
├── Sidebar.jsx                    # Menú lateral
├── Topbar.jsx                     # Barra superior
└── SyncButton.jsx                 # Botón de sincronización
```

---

## 💾 Modelos de Datos Backend

### Modelo: Pedido
```python
class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('CONFIRMADO', 'Confirmado'),
        ('ENTREGADO', 'Entregado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    TIPO_CHOICES = [
        ('NORMAL', 'Normal'),
        ('URGENTE', 'Urgente'),
        ('ESPECIAL', 'Especial'),
    ]
    
    numero_pedido = models.CharField(max_length=50, unique=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    destinatario = models.CharField(max_length=255)
    direccion_entrega = models.TextField(blank=True, null=True)
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    fecha_entrega = models.DateField()
    tipo_pedido = models.CharField(max_length=20, choices=TIPO_CHOICES, default='NORMAL')
    transportadora = models.CharField(max_length=100, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    nota = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### Modelo: DetallePedido
```python
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save()
```

---

## 🔌 Endpoints API

### Crear Pedido
```
POST /api/pedidos/

Request:
{
  "vendedor": "Juan Pérez",
  "destinatario": "Cliente XYZ",
  "direccion_entrega": "Calle 1 #123",
  "telefono_contacto": "3001234567",
  "fecha_entrega": "2025-11-20",
  "tipo_pedido": "NORMAL",
  "transportadora": "Servientrega",
  "subtotal": 100000,
  "impuestos": 0,
  "descuentos": 0,
  "total": 100000,
  "detalles": [
    {
      "producto": 1,
      "cantidad": 2,
      "precio_unitario": 50000
    }
  ]
}

Response:
{
  "id": 1,
  "numero_pedido": "PED20251117001",
  "fecha": "2025-11-17T10:30:00Z",
  "vendedor": "Juan Pérez",
  "destinatario": "Cliente XYZ",
  "fecha_entrega": "2025-11-20",
  "total": 100000,
  "estado": "PENDIENTE",
  "detalles": [...]
}
```

### Listar Pedidos
```
GET /api/pedidos/?fecha_inicio=2025-11-01&fecha_fin=2025-11-30&estado=PENDIENTE

Response:
[
  {
    "id": 1,
    "numero_pedido": "PED20251117001",
    "fecha": "2025-11-17T10:30:00Z",
    "vendedor": "Juan Pérez",
    "destinatario": "Cliente XYZ",
    "total": 100000,
    "estado": "PENDIENTE"
  },
  ...
]
```

### Obtener Pedido
```
GET /api/pedidos/{id}/

Response:
{
  "id": 1,
  "numero_pedido": "PED20251117001",
  "fecha": "2025-11-17T10:30:00Z",
  "vendedor": "Juan Pérez",
  "destinatario": "Cliente XYZ",
  "direccion_entrega": "Calle 1 #123",
  "telefono_contacto": "3001234567",
  "fecha_entrega": "2025-11-20",
  "tipo_pedido": "NORMAL",
  "transportadora": "Servientrega",
  "subtotal": 100000,
  "impuestos": 0,
  "descuentos": 0,
  "total": 100000,
  "estado": "PENDIENTE",
  "detalles": [...]
}
```

### Actualizar Estado
```
PUT /api/pedidos/{id}/

Request:
{
  "estado": "ENTREGADO",
  "nota": "Entregado correctamente"
}

Response:
{
  "id": 1,
  "numero_pedido": "PED20251117001",
  "estado": "ENTREGADO",
  "fecha_actualizacion": "2025-11-20T14:30:00Z"
}
```

---

## 🔄 Flujo de Pedido Completo

### 1. Crear Pedido
```javascript
// PedidosScreen.jsx
const handleCreatePedido = async (pedidoData) => {
  // Validar datos
  // Crear pedido en backend
  const response = await fetch('/api/pedidos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedidoData)
  });
  
  const pedido = await response.json();
  
  // Actualizar planeación
  // Actualizar cargue
  // Mostrar confirmación
};
```

### 2. Agregar Productos
```javascript
// Cart.jsx
const handleAddProduct = (product) => {
  const existingItem = cartItems.find(item => item.id === product.id);
  
  if (existingItem) {
    setCartItems(cartItems.map(item =>
      item.id === product.id
        ? { ...item, cantidad: item.cantidad + 1 }
        : item
    ));
  } else {
    setCartItems([...cartItems, { ...product, cantidad: 1 }]);
  }
  
  updateTotals();
};
```

### 3. Definir Fecha de Entrega
```javascript
// ConsumerForm.jsx
const handleDateChange = (date) => {
  setFechaEntrega(date);
  // Cargar planeación para esa fecha
  loadPlaneacion(date);
};
```

### 4. Confirmar Pedido
```javascript
// PedidosScreen.jsx
const handleConfirmPedido = async () => {
  // Validar carrito
  // Crear pedido
  // Actualizar planeación
  // Actualizar cargue
  // Limpiar carrito
};
```

### 5. Seguimiento
```javascript
// ModalDetallePedido.jsx
const loadPedidoDetails = async (pedidoId) => {
  const response = await fetch(`/api/pedidos/${pedidoId}/`);
  const pedido = await response.json();
  setPedido(pedido);
};
```

### 6. Confirmar Entrega
```javascript
// PedidosScreen.jsx
const handleConfirmEntrega = async (pedidoId) => {
  const response = await fetch(`/api/pedidos/${pedidoId}/`, {
    method: 'PUT',
    body: JSON.stringify({ estado: 'ENTREGADO' })
  });
  
  // Actualizar lista
  loadPedidos();
};
```

---

## 📊 Servicios Frontend

### pedidoService.js (Conceptual)
```javascript
export const pedidoService = {
  // Crear pedido
  createPedido: async (pedidoData) => {
    return fetch('/api/pedidos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData)
    }).then(r => r.json());
  },
  
  // Listar pedidos
  getPedidos: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`/api/pedidos/?${params}`).then(r => r.json());
  },
  
  // Obtener pedido
  getPedido: async (pedidoId) => {
    return fetch(`/api/pedidos/${pedidoId}/`).then(r => r.json());
  },
  
  // Actualizar pedido
  updatePedido: async (pedidoId, pedidoData) => {
    return fetch(`/api/pedidos/${pedidoId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData)
    }).then(r => r.json());
  },
  
  // Eliminar pedido
  deletePedido: async (pedidoId) => {
    return fetch(`/api/pedidos/${pedidoId}/`, {
      method: 'DELETE'
    });
  }
};
```

---

## 🎨 Estilos Principales

### PedidosScreen.css
```css
.pedidos-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.pedidos-main {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pedidos-sidebar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pedido-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.pedido-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.pedido-numero {
  font-weight: bold;
  font-size: 16px;
  color: #007bff;
}

.pedido-estado {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.estado-pendiente {
  background-color: #ffc107;
  color: #333;
}

.estado-confirmado {
  background-color: #17a2b8;
  color: white;
}

.estado-entregado {
  background-color: #28a745;
  color: white;
}

.estado-cancelado {
  background-color: #dc3545;
  color: white;
}

.pedido-info {
  font-size: 14px;
  margin-bottom: 8px;
}

.pedido-info strong {
  color: #333;
}

.pedido-total {
  font-size: 18px;
  font-weight: bold;
  color: #28a745;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ddd;
}

.cart-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-totals {
  border-top: 2px solid #ddd;
  padding-top: 15px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 18px;
  color: #28a745;
}
```

---

## 🔐 Validaciones

### Validación de Pedido
```javascript
const validatePedido = (pedidoData) => {
  if (!pedidoData.destinatario) {
    throw new Error('Debe especificar el destinatario');
  }
  
  if (!pedidoData.fecha_entrega) {
    throw new Error('Debe especificar la fecha de entrega');
  }
  
  if (pedidoData.detalles.length === 0) {
    throw new Error('El pedido debe tener al menos un producto');
  }
  
  if (pedidoData.total <= 0) {
    throw new Error('El total debe ser mayor a 0');
  }
  
  return true;
};
```

### Validación de Stock
```javascript
const validateStock = async (detalles) => {
  for (const detalle of detalles) {
    const response = await fetch(`/api/productos/${detalle.producto}/`);
    const producto = await response.json();
    
    if (detalle.cantidad > producto.stock_total) {
      throw new Error(
        `Stock insuficiente para ${producto.nombre}. ` +
        `Disponible: ${producto.stock_total}, Solicitado: ${detalle.cantidad}`
      );
    }
  }
  
  return true;
};
```

---

## 📱 Pantalla Principal (PedidosScreen.jsx)

```javascript
import React, { useState, useEffect } from 'react';
import ProductList from '../components/Pedidos/ProductList';
import Cart from '../components/Pedidos/Cart';
import ConsumerForm from '../components/Pedidos/ConsumerForm';
import './PedidosScreen.css';

export default function PedidosScreen() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cliente, setCliente] = useState({});
  const [fechaEntrega, setFechaEntrega] = useState(new Date());
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      const response = await fetch('/api/productos/?activo=true');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };
  
  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, cantidad: 1 }]);
    }
  };
  
  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };
  
  const handleCreatePedido = async () => {
    try {
      if (cartItems.length === 0) {
        alert('El carrito está vacío');
        return;
      }
      
      const total = cartItems.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
      
      const response = await fetch('/api/pedidos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendedor: 'Sistema',
          destinatario: cliente.nombre,
          direccion_entrega: cliente.direccion,
          telefono_contacto: cliente.telefono,
          fecha_entrega: fechaEntrega.toISOString().split('T')[0],
          tipo_pedido: 'NORMAL',
          subtotal: total,
          impuestos: 0,
          descuentos: 0,
          total: total,
          detalles: cartItems.map(item => ({
            producto: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
          }))
        })
      });
      
      if (response.ok) {
        const pedido = await response.json();
        alert(`Pedido creado: ${pedido.numero_pedido}`);
        setCartItems([]);
        setCliente({});
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="pedidos-container">
      <div className="pedidos-main">
        <ConsumerForm
          cliente={cliente}
          onClienteChange={setCliente}
          fechaEntrega={fechaEntrega}
          onFechaChange={setFechaEntrega}
        />
        
        <ProductList
          products={products}
          onAddToCart={handleAddToCart}
        />
      </div>
      
      <div className="pedidos-sidebar">
        <Cart
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onCreatePedido={handleCreatePedido}
        />
      </div>
    </div>
  );
}
```

---

## 🔄 Integración con Otros Módulos

### Actualización de Planeación
Cuando se crea un pedido:
1. Se suma la cantidad a `solicitadas` en planeación
2. Se actualiza la fecha de entrega
3. Se calcula sugerencia de producción

### Actualización de Cargue
Cuando se crea un pedido:
1. Se suma al `total_pedidos` del cargue
2. Se actualiza el `total_efectivo`

### Reserva de Stock
Cuando se crea un pedido:
1. Se reserva el stock del producto
2. Se actualiza disponibilidad
3. Se genera alerta si stock es insuficiente

---

## 📊 Reportes

### Reporte de Pedidos Pendientes
```javascript
const generatePendingReport = async () => {
  const response = await fetch('/api/pedidos/?estado=PENDIENTE');
  const pedidos = await response.json();
  
  return {
    total_pedidos: pedidos.length,
    total_monto: pedidos.reduce((sum, p) => sum + p.total, 0),
    por_vendedor: agruparPorVendedor(pedidos),
    por_fecha_entrega: agruparPorFecha(pedidos)
  };
};
```

---

## 🚀 Optimizaciones

1. **Caché de Productos**: Se cachean los productos
2. **Búsqueda Optimizada**: Búsqueda en cliente
3. **Validación en Cliente**: Validaciones antes de enviar
4. **Actualización Automática**: Los cambios se sincronizan

---

## 📝 Checklist de Implementación

- [ ] Crear componente PedidosScreen
- [ ] Implementar ProductList y ProductCard
- [ ] Crear Cart con lógica de carrito
- [ ] Implementar ConsumerForm
- [ ] Crear ModalDetallePedido
- [ ] Integrar con API de pedidos
- [ ] Implementar seguimiento de pedidos
- [ ] Agregar validaciones
- [ ] Crear reportes
- [ ] Optimizar rendimiento

---

**Última actualización**: 17 de Noviembre de 2025
