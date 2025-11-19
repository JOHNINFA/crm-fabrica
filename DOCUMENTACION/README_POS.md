# 🛒 Módulo POS (Punto de Venta)

## 📋 Descripción General

El módulo POS es el sistema de punto de venta que permite registrar ventas en tiempo real, gestionar el carrito de compras, procesar pagos y generar facturas. Incluye gestión de caja (apertura/cierre de turno, arqueo) e historial de ventas. Es utilizado por cajeros y vendedores en mostrador.

---

## 🎯 Funcionalidades Principales

### 1. Venta de Productos
- Búsqueda por nombre, código de barras
- Filtrado por categoría
- Visualización de stock disponible
- Precios actualizados en tiempo real
- Agregar/eliminar productos del carrito
- Modificar cantidades
- Aplicar descuentos por producto

### 2. Procesamiento de Pago
- Múltiples métodos de pago:
  - Efectivo
  - Tarjeta de crédito/débito
  - Transferencia bancaria
  - Billetera digital (Nequi, Daviplata)
  - QR
  - Bonos
  - Otros
- Cálculo automático de cambio
- Generación de factura con numeración automática

### 3. Gestión de Caja (Integrada en POS)
- **Apertura de Turno**: Registrar base inicial
- **Cierre de Turno**: Finalizar operaciones del día
- **Arqueo de Caja**: 
  - Comparar valores del sistema vs valores físicos
  - Registrar diferencias por método de pago
  - Validaciones automáticas
  - Recomendaciones de ajuste
- **Historial de Movimientos**: Registro de todas las transacciones

### 4. Historial de Ventas
- Registro de todas las ventas realizadas
- Información de vendedor, cliente, fecha, hora
- Métodos de pago utilizados
- Estados de venta (pagado, pendiente, cancelado, anulada)

---

## 🏗️ Estructura de Componentes Frontend

### Componentes Principales

```
frontend/src/components/Pos/
├── PosScreen.jsx              # Pantalla principal del POS
├── Topbar.jsx                 # Barra superior (info de usuario, hora)
├── Sidebar.jsx                # Menú lateral
├── ProductList.jsx            # Lista de productos
├── ProductCard.jsx            # Tarjeta individual de producto
├── Cart.jsx                   # Carrito de compras
├── PaymentModal.jsx           # Modal de pago
├── InvoiceModal.jsx           # Modal de factura
├── LoginCajeroModal.jsx       # Login de cajero
├── CajaModal.jsx              # Gestión de caja
├── CategoryManager.jsx        # Gestor de categorías
├── ProductsModal.jsx          # Modal de búsqueda de productos
└── AddProductModal.jsx        # Modal para agregar productos
```

### Flujo de Componentes

```
PosScreen (Contenedor principal)
├── Topbar (Información del usuario)
├── Sidebar (Menú de opciones)
├── ProductList (Catálogo de productos)
│   └── ProductCard (Tarjeta de producto)
├── Cart (Carrito de compras)
│   └── Botones de acción
└── Modales
    ├── LoginCajeroModal
    ├── PaymentModal
    ├── InvoiceModal
    └── CajaModal
```

---

## 💾 Modelos de Datos Backend

### Modelo: Venta
```python
class Venta(models.Model):
    numero_factura = models.CharField(max_length=50, unique=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    cliente = models.CharField(max_length=255, default='CONSUMIDOR FINAL')
    metodo_pago = models.CharField(max_length=20, choices=[
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('T_CREDITO', 'T. Crédito'),
        ('QR', 'Qr'),
        ('TRANSF', 'Transf'),
        ('RAPPIPAY', 'RAPPIPAY'),
        ('BONOS', 'Bonos'),
        ('OTROS', 'Otros'),
    ])
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    dinero_entregado = models.DecimalField(max_digits=10, decimal_places=2)
    devuelta = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=[
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('CANCELADO', 'Cancelado'),
        ('ANULADA', 'Anulada'),
    ])
    nota = models.TextField(blank=True, null=True)
    banco = models.CharField(max_length=100, default='Caja General')
    centro_costo = models.CharField(max_length=100, blank=True, null=True)
    bodega = models.CharField(max_length=100, default='Principal')
```

### Modelo: DetalleVenta
```python
class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self):
        # Calcular subtotal
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Crear movimiento de inventario (SALIDA)
        MovimientoInventario.objects.create(
            producto=self.producto,
            tipo='SALIDA',
            cantidad=self.cantidad,
            usuario=self.venta.vendedor,
            nota=f'Venta #{self.venta.numero_factura}'
        )
        super().save()
```

---

## 🔌 Endpoints API

### Crear Venta
```
POST /api/ventas/

Request:
{
  "vendedor": "Juan Pérez",
  "cliente": "CONSUMIDOR FINAL",
  "metodo_pago": "EFECTIVO",
  "subtotal": 50000,
  "impuestos": 0,
  "descuentos": 0,
  "total": 50000,
  "dinero_entregado": 50000,
  "devuelta": 0,
  "estado": "PAGADO",
  "detalles": [
    {
      "producto": 1,
      "cantidad": 2,
      "precio_unitario": 25000
    }
  ]
}

Response:
{
  "id": 1,
  "numero_factura": "F12345678",
  "fecha": "2025-11-17T10:30:00Z",
  "vendedor": "Juan Pérez",
  "cliente": "CONSUMIDOR FINAL",
  "metodo_pago": "EFECTIVO",
  "total": 50000,
  "estado": "PAGADO",
  "detalles": [
    {
      "id": 1,
      "producto": 1,
      "cantidad": 2,
      "precio_unitario": 25000,
      "subtotal": 50000
    }
  ]
}
```

### Listar Ventas
```
GET /api/ventas/?fecha_inicio=2025-11-01&fecha_fin=2025-11-30&vendedor=Juan

Response:
[
  {
    "id": 1,
    "numero_factura": "F12345678",
    "fecha": "2025-11-17T10:30:00Z",
    "vendedor": "Juan Pérez",
    "total": 50000,
    "estado": "PAGADO"
  },
  ...
]
```

### Obtener Venta
```
GET /api/ventas/{id}/

Response:
{
  "id": 1,
  "numero_factura": "F12345678",
  "fecha": "2025-11-17T10:30:00Z",
  "vendedor": "Juan Pérez",
  "cliente": "CONSUMIDOR FINAL",
  "metodo_pago": "EFECTIVO",
  "subtotal": 50000,
  "impuestos": 0,
  "descuentos": 0,
  "total": 50000,
  "dinero_entregado": 50000,
  "devuelta": 0,
  "estado": "PAGADO",
  "detalles": [...]
}
```

### Listar Productos
```
GET /api/productos/?categoria=1&activo=true

Response:
[
  {
    "id": 1,
    "nombre": "Producto A",
    "descripcion": "Descripción",
    "precio": 25000,
    "stock_total": 100,
    "categoria": 1,
    "imagen": "/media/productos/img.jpg",
    "codigo_barras": "123456789",
    "marca": "MARCA",
    "activo": true
  },
  ...
]
```

---

## 🔄 Flujo de Venta Completo

### 1. Inicio de Sesión
```javascript
// LoginCajeroModal.jsx
const handleLogin = async (nombre, password) => {
  // Validar credenciales
  // Guardar sesión en localStorage
  // Redirigir a POS
};
```

### 2. Búsqueda de Productos
```javascript
// ProductList.jsx
const handleSearch = (query) => {
  // Filtrar productos por nombre o código de barras
  // Actualizar lista visible
};

const handleCategoryFilter = (categoryId) => {
  // Filtrar por categoría
  // Actualizar lista visible
};
```

### 3. Agregar al Carrito
```javascript
// ProductCard.jsx
const handleAddToCart = (product) => {
  // Validar stock disponible
  // Agregar a carrito (Context API)
  // Actualizar cantidad si ya existe
  // Mostrar notificación
};
```

### 4. Modificar Carrito
```javascript
// Cart.jsx
const handleUpdateQuantity = (productId, newQuantity) => {
  // Validar cantidad vs stock
  // Actualizar cantidad
  // Recalcular totales
};

const handleRemoveItem = (productId) => {
  // Eliminar del carrito
  // Recalcular totales
};

const handleApplyDiscount = (productId, discountPercent) => {
  // Aplicar descuento
  // Recalcular subtotal
};
```

### 5. Procesar Pago
```javascript
// PaymentModal.jsx
const handlePayment = async (paymentData) => {
  // Validar método de pago
  // Calcular cambio
  // Crear venta en backend
  // Actualizar stock
  // Generar factura
  // Mostrar confirmación
};
```

### 6. Generar Factura
```javascript
// InvoiceModal.jsx
const handlePrintInvoice = () => {
  // Obtener datos de venta
  // Formatear para impresión
  // Enviar a impresora
  // Guardar en historial
};
```

---

## 📊 Servicios Frontend

### cajaService.js
```javascript
// Gestión de caja
export const cajaService = {
  // Abrir turno
  abrirTurno: async (cajeroId, baseInicial) => {
    return fetch('/api/turnos/', {
      method: 'POST',
      body: JSON.stringify({ cajero: cajeroId, base_inicial: baseInicial })
    });
  },
  
  // Cerrar turno
  cerrarTurno: async (turnoId, arqueoData) => {
    return fetch(`/api/turnos/${turnoId}/`, {
      method: 'PUT',
      body: JSON.stringify(arqueoData)
    });
  },
  
  // Obtener turno activo
  getTurnoActivo: async (cajeroId) => {
    return fetch(`/api/turnos/?cajero=${cajeroId}&estado=ACTIVO`);
  }
};
```

### api.js (Configuración)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...apiConfig,
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};
```

---

## 🎨 Estilos Principales

### PosScreen.css
```css
.pos-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.products-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  overflow-y: auto;
}

.product-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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

### ProductCard.css
```css
.product-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.product-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.product-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  color: #28a745;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.product-stock {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.add-button {
  width: 100%;
  padding: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.add-button:hover {
  background-color: #0056b3;
}

.add-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

---

## 🔐 Validaciones

### Validación de Stock
```javascript
const validateStock = (product, quantity) => {
  if (quantity > product.stock_total) {
    throw new Error(`Stock insuficiente. Disponible: ${product.stock_total}`);
  }
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  return true;
};
```

### Validación de Pago
```javascript
const validatePayment = (paymentData, totalAmount) => {
  if (!paymentData.metodo_pago) {
    throw new Error('Debe seleccionar un método de pago');
  }
  
  if (paymentData.dinero_entregado < totalAmount) {
    throw new Error('El dinero entregado es menor al total');
  }
  
  return true;
};
```

### Validación de Carrito
```javascript
const validateCart = (items) => {
  if (items.length === 0) {
    throw new Error('El carrito está vacío');
  }
  
  const hasValidItems = items.every(item => 
    item.cantidad > 0 && item.precio_unitario > 0
  );
  
  if (!hasValidItems) {
    throw new Error('Hay items inválidos en el carrito');
  }
  
  return true;
};
```

---

## 📱 Pantalla Principal (PosScreen.jsx)

```javascript
import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import ProductList from './ProductList';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import LoginCajeroModal from './LoginCajeroModal';
import './PosScreen.css';

export default function PosScreen() {
  const { products, loading } = useContext(ProductContext);
  const [cartItems, setCartItems] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [cajeroLogueado, setCajeroLogueado] = useState(null);
  
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
  
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId
          ? { ...item, cantidad: newQuantity }
          : item
      ));
    }
  };
  
  const handlePaymentComplete = async (paymentData) => {
    try {
      // Crear venta en backend
      const response = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendedor: cajeroLogueado.nombre,
          cliente: paymentData.cliente || 'CONSUMIDOR FINAL',
          metodo_pago: paymentData.metodo_pago,
          subtotal: paymentData.subtotal,
          impuestos: paymentData.impuestos,
          descuentos: paymentData.descuentos,
          total: paymentData.total,
          dinero_entregado: paymentData.dinero_entregado,
          devuelta: paymentData.devuelta,
          estado: 'PAGADO',
          detalles: cartItems.map(item => ({
            producto: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
          }))
        })
      });
      
      if (response.ok) {
        const venta = await response.json();
        alert(`Venta registrada: ${venta.numero_factura}`);
        setCartItems([]);
        setShowPayment(false);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  if (!cajeroLogueado) {
    return <LoginCajeroModal onLogin={setCajeroLogueado} />;
  }
  
  return (
    <div className="pos-container">
      <div className="products-section">
        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <ProductList products={products} onAddToCart={handleAddToCart} />
        )}
      </div>
      
      <div className="cart-section">
        <Cart
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={() => setShowPayment(true)}
        />
      </div>
      
      {showPayment && (
        <PaymentModal
          cartItems={cartItems}
          onPayment={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
```

---

## 🔄 Integración con Otros Módulos

### Actualización de Stock
Cuando se crea una venta, el sistema automáticamente:
1. Crea un `MovimientoInventario` de tipo SALIDA
2. Actualiza el `stock_total` del producto
3. Registra el usuario y fecha del movimiento

### Integración con Cargue
Si el vendedor tiene un cargue activo:
1. La venta se suma al `total_despacho`
2. Se actualiza el `total_efectivo`
3. Se registra en el resumen de ventas

### Integración con Planeación
El stock actualizado se refleja en:
1. Planeación de producción
2. Disponibilidad para pedidos
3. Alertas de stock bajo

---

## 📊 Reportes

### Reporte de Ventas del Día
```javascript
const generateDailySalesReport = async (fecha) => {
  const response = await fetch(
    `/api/ventas/?fecha_inicio=${fecha}&fecha_fin=${fecha}`
  );
  const ventas = await response.json();
  
  return {
    total_ventas: ventas.length,
    total_monto: ventas.reduce((sum, v) => sum + v.total, 0),
    por_metodo_pago: agruparPorMetodoPago(ventas),
    por_vendedor: agruparPorVendedor(ventas)
  };
};
```

---

## 🚀 Optimizaciones

1. **Caché de Productos**: Los productos se cargan una sola vez y se cachean
2. **Búsqueda Optimizada**: Búsqueda en cliente (sin llamadas API)
3. **Lazy Loading**: Las imágenes se cargan bajo demanda
4. **Debounce**: La búsqueda tiene debounce para evitar múltiples llamadas

---

## 📝 Checklist de Implementación

- [ ] Crear componente PosScreen
- [ ] Implementar ProductList y ProductCard
- [ ] Crear Cart con lógica de carrito
- [ ] Implementar PaymentModal
- [ ] Crear LoginCajeroModal
- [ ] Integrar con API de ventas
- [ ] Implementar impresión de facturas
- [ ] Agregar validaciones
- [ ] Crear reportes
- [ ] Optimizar rendimiento

---

**Última actualización**: 17 de Noviembre de 2025
