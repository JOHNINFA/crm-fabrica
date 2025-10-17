# ⚛️ FRONTEND REACT - DOCUMENTACIÓN COMPLETA

## ÍNDICE
1. [Estructura de Archivos](#estructura-de-archivos)
2. [Configuración Principal](#configuración-principal)
3. [Servicios API](#servicios-api)
4. [Contextos](#contextos)
5. [Componentes por Módulo](#componentes-por-módulo)
6. [Rutas y Navegación](#rutas-y-navegación)

---

## ESTRUCTURA DE ARCHIVOS

```
frontend/
├── public/
│   ├── images/
│   │   └── productos/          # Imágenes de productos
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── assets/
│   │   └── images/
│   │       └── icono.png       # Logo del sistema
│   ├── components/
│   │   ├── Pos/                # Componentes POS
│   │   │   ├── ProductList.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── PaymentModal.jsx
│   │   │   ├── ConsumerForm.jsx
│   │   │   └── LoginCajeroModal.jsx
│   │   ├── Remisiones/         # Componentes Remisiones
│   │   │   ├── ProductList.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── PaymentModal.jsx
│   │   │   ├── ConsumerForm.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── Cargue/             # Componentes Cargue
│   │   │   ├── MenuSheets.jsx
│   │   │   ├── PlantillaOperativa.jsx
│   │   │   ├── TablaProductos.jsx
│   │   │   ├── ResumenVentas.jsx
│   │   │   └── Produccion.jsx
│   │   ├── inventario/         # Componentes Inventario
│   │   │   ├── InventarioProduccion.jsx
│   │   │   ├── TablaKardex.jsx
│   │   │   └── TablaInventario.jsx
│   │   ├── Clientes/           # Componentes Clientes
│   │   │   └── tabs/
│   │   │       ├── InformacionBasica.jsx
│   │   │       ├── Configuracion.jsx
│   │   │       └── Contacto.jsx
│   │   └── common/             # Componentes comunes
│   │       └── ImageSyncButton.jsx
│   ├── context/
│   │   ├── ProductContext.jsx
│   │   ├── CajeroContext.jsx
│   │   ├── CajeroRemisionesContext.jsx
│   │   ├── ModalContext.jsx
│   │   └── UsuariosContext.jsx
│   ├── pages/
│   │   ├── MainMenu.jsx
│   │   ├── PosScreen.jsx
│   │   ├── RemisionesScreen.jsx
│   │   ├── PedidosScreen.jsx
│   │   ├── PedidosDiaScreen.jsx
│   │   ├── InventarioScreen.jsx
│   │   ├── SelectorDia.jsx
│   │   ├── ClientesScreen.jsx
│   │   ├── ListaClientesScreen.jsx
│   │   ├── VendedoresScreen.jsx
│   │   ├── CajaScreen.jsx
│   │   ├── InformeVentasGeneral.jsx
│   │   └── InformeRemisionesScreen.jsx
│   ├── services/
│   │   └── api.js              # Servicios API centralizados
│   ├── styles/
│   │   └── *.css               # Estilos globales
│   ├── App.js                  # Componente principal
│   ├── App.css
│   ├── index.js                # Punto de entrada
│   └── index.css
└── package.json
```

---

## CONFIGURACIÓN PRINCIPAL

### App.js - Rutas Principales
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UsuariosProvider } from './context/UsuariosContext';

// Importar todas las páginas
import MainMenu from './pages/MainMenu';
import PosScreen from './pages/PosScreen';
import RemisionesScreen from './pages/RemisionesScreen';
import PedidosScreen from './pages/PedidosScreen';
import PedidosDiaScreen from './pages/PedidosDiaScreen';
// ... más imports

function App() {
  return (
    <UsuariosProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/pos" element={<PosScreen />} />
            <Route path="/remisiones" element={<RemisionesScreen />} />
            <Route path="/pedidos" element={<PedidosScreen />} />
            <Route path="/pedidos/:dia" element={<PedidosDiaScreen />} />
            <Route path="/inventario" element={<InventarioScreen />} />
            <Route path="/cargue" element={<SelectorDia />} />
            <Route path="/cargue/:dia" element={<MenuSheets />} />
            <Route path="/informes/general" element={<InformeVentasGeneral />} />
            <Route path="/informes/remisiones" element={<InformeRemisionesScreen />} />
            <Route path="/clientes" element={<ListaClientesScreen />} />
            <Route path="/clientes/nuevo" element={<ClientesScreen />} />
            <Route path="/clientes/editar/:id" element={<ClientesScreen />} />
            <Route path="/vendedores" element={<VendedoresScreen />} />
            <Route path="/caja" element={<CajaScreen />} />
          </Routes>
        </div>
      </Router>
    </UsuariosProvider>
  );
}

export default App;
```

### index.js - Punto de Entrada
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## SERVICIOS API

### services/api.js - Configuración Base
```javascript
const API_URL = 'http://localhost:8000/api';

const handleApiError = (error) => {
  console.warn('API no disponible, usando almacenamiento local:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};
```

### Servicio de Productos
```javascript
export const productoService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/productos/`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  create: async (productoData) => {
    try {
      // Manejo de imagen base64
      if (productoData.imagen && productoData.imagen.startsWith('data:')) {
        const formData = new FormData();
        const imageFile = base64ToFile(productoData.imagen, 'producto.jpg');
        if (imageFile) formData.append('imagen', imageFile);
        
        Object.keys(productoData).forEach(key => {
          if (key !== 'imagen' && productoData[key] !== null) {
            formData.append(key, productoData[key]);
          }
        });
        
        const response = await fetch(`${API_URL}/productos/`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
      }
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateStock: async (id, cantidad, usuario, nota) => {
    try {
      const response = await fetch(`${API_URL}/productos/${id}/actualizar_stock/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad, usuario, nota }),
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};
```

### Servicio de Ventas
```javascript
export const ventaService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/ventas/?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback a localStorage
      const ventasGuardadas = localStorage.getItem('ventas_pos');
      return ventasGuardadas ? JSON.parse(ventasGuardadas) : [];
    } catch (error) {
      return [];
    }
  },

  create: async (ventaData) => {
    try {
      const response = await fetch(`${API_URL}/ventas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData),
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};
```

### Servicio de Remisiones
```javascript
export const remisionService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/remisiones/?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback a localStorage
      const remisionesGuardadas = localStorage.getItem('remisiones_sistema');
      return remisionesGuardadas ? JSON.parse(remisionesGuardadas) : [];
    } catch (error) {
      return [];
    }
  },

  create: async (remisionData) => {
    try {
      const response = await fetch(`${API_URL}/remisiones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remisionData),
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback: guardar en localStorage
      const remisionesGuardadas = JSON.parse(
        localStorage.getItem('remisiones_sistema') || '[]'
      );
      
      const nuevoId = Date.now();
      const numeroRemision = `REM-${String(nuevoId).slice(-6)}`;
      
      const nuevaRemision = {
        id: nuevoId,
        numero_remision: numeroRemision,
        ...remisionData,
        fecha_creacion: new Date().toISOString()
      };
      
      remisionesGuardadas.push(nuevaRemision);
      localStorage.setItem('remisiones_sistema', JSON.stringify(remisionesGuardadas));
      
      return nuevaRemision;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
```

---

## CONTEXTOS

### ProductContext.jsx - Gestión de Productos
```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { productoService, categoriaService } from '../services/api';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productoService.getAll();
      if (!data.error) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriaService.getAll();
      if (!data.error) {
        setCategories(data.map(c => c.nombre));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const addProduct = async (productData) => {
    try {
      const newProduct = await productoService.create(productData);
      if (!newProduct.error) {
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
      }
    } catch (error) {
      console.error('Error agregando producto:', error);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updated = await productoService.update(id, productData);
      if (!updated.error) {
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      loading,
      loadProducts,
      addProduct,
      updateProduct
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductProvider');
  }
  return context;
};
```

### CajeroContext.jsx - Gestión de Cajeros POS
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';

const CajeroContext = createContext();

export const CajeroProvider = ({ children }) => {
  const [cajeroLogueado, setCajeroLogueado] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);

  useEffect(() => {
    // Cargar cajero desde localStorage
    const cajeroGuardado = localStorage.getItem('cajero_pos');
    if (cajeroGuardado) {
      const cajero = JSON.parse(cajeroGuardado);
      setCajeroLogueado(cajero);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (codigo, saldoInicial) => {
    try {
      // Buscar cajero en API o localStorage
      const cajero = { nombre: codigo, saldo_inicial: saldoInicial };
      
      setCajeroLogueado(cajero);
      setIsAuthenticated(true);
      localStorage.setItem('cajero_pos', JSON.stringify(cajero));
      
      // Crear turno
      const turno = {
        id: Date.now(),
        cajero: cajero.nombre,
        fecha_inicio: new Date().toISOString(),
        base_inicial: saldoInicial,
        estado: 'ACTIVO'
      };
      
      setTurnoActual(turno);
      localStorage.setItem('turno_activo_pos', JSON.stringify(turno));
      
      return { success: true, cajero, turno };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setCajeroLogueado(null);
    setIsAuthenticated(false);
    setTurnoActual(null);
    localStorage.removeItem('cajero_pos');
    localStorage.removeItem('turno_activo_pos');
  };

  return (
    <CajeroContext.Provider value={{
      cajeroLogueado,
      isAuthenticated,
      turnoActual,
      login,
      logout
    }}>
      {children}
    </CajeroContext.Provider>
  );
};

export const useCajero = () => {
  const context = useContext(CajeroContext);
  if (!context) {
    throw new Error('useCajero debe usarse dentro de CajeroProvider');
  }
  return context;
};
```

---

## COMPONENTES POR MÓDULO

### POS - ProductList.jsx
```javascript
import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import ProductCard from './ProductCard';

export default function ProductList({ addProduct, search, setSearch, priceList }) {
  const { products, categories } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-control mb-3"
      />

      {/* Filtro de categorías */}
      <div className="category-buttons mb-3">
        <button
          className={selectedCategory === 'Todos' ? 'active' : ''}
          onClick={() => setSelectedCategory('Todos')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="row g-3">
        {filteredProducts.map(product => (
          <div key={product.id} className="col-md-4">
            <ProductCard
              product={product}
              onClick={(p, price) => addProduct(p, price)}
              priceList={priceList}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### POS - Cart.jsx
```javascript
import React, { useState } from 'react';
import PaymentModal from './PaymentModal';

export default function Cart({
  cart,
  removeProduct,
  changeQty,
  subtotal,
  imp,
  desc,
  total,
  setImp,
  setDesc,
  seller,
  client,
  clearCart
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount) => `$${(amount || 0).toLocaleString()}`;

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <h5>Carrito de Compras</h5>
      </div>

      {/* Body - Items */}
      <div className="cart-body">
        {cart.length > 0 ? (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <span>{item.name}</span>
                <button onClick={() => removeProduct(item.id)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="cart-item-controls">
                <button onClick={() => changeQty(item.id, -1)}>-</button>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => changeQty(item.id, parseInt(e.target.value) - item.qty)}
                />
                <button onClick={() => changeQty(item.id, 1)}>+</button>
              </div>
              <div className="cart-item-price">
                {item.qty} x {formatCurrency(item.price)} = {formatCurrency(item.qty * item.price)}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-cart">
            <i className="bi bi-cart"></i>
            <p>No hay productos en el carrito</p>
          </div>
        )}
      </div>

      {/* Footer - Totales */}
      <div className="cart-footer">
        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Impuestos</span>
            <input
              type="number"
              value={imp}
              onChange={(e) => setImp(Number(e.target.value))}
            />
          </div>
          <div className="summary-row">
            <span>Descuento</span>
            <input
              type="number"
              value={desc}
              onChange={(e) => setDesc(Number(e.target.value))}
            />
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          className="checkout-button"
          onClick={() => setShowPaymentModal(true)}
          disabled={cart.length === 0}
        >
          Procesar Pago
        </button>
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        total={total}
        subtotal={subtotal}
        impuestos={imp}
        descuentos={desc}
        seller={seller}
        client={client}
        clearCart={clearCart}
      />
    </div>
  );
}
```

---

*Continúa en INSTRUCCIONES_INSTALACION.md*


---

## ACTUALIZACIONES RECIENTES - MÓDULO DE PEDIDOS

### Fecha: 15/10/2025

#### 1. Corrección de Zona Horaria en Fechas

**Problema:** Las fechas de los pedidos se guardaban con un día de diferencia debido a la conversión de zona horaria UTC.

**Solución Implementada:**

**Frontend - PaymentModal.jsx:**
```javascript
// Antes: Enviaba fecha con hora (causaba problemas de zona horaria)
const getFechaLocal = () => {
    const hoy = new Date();
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

// Después: Envía solo la fecha sin hora
const getFechaLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

**Frontend - InformePedidosScreen.jsx:**
```javascript
// Parseo directo de fecha sin conversión de zona horaria
const formatFecha = (fecha) => {
    if (!fecha) return '-';
    if (typeof fecha === 'string' && fecha.includes('-')) {
        const [year, month, day] = fecha.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO');
};
```

**Archivos Modificados:**
- `frontend/src/components/Pedidos/PaymentModal.jsx`
- `frontend/src/pages/InformePedidosScreen.jsx`

---

#### 2. Corrección de Suma de Totales en Informe

**Problema:** El total en el informe de pedidos concatenaba valores en lugar de sumarlos.

**Solución:**
```javascript
// Antes
pedidos.reduce((sum, r) => sum + (r.total || 0), 0)

// Después: Convierte string a número antes de sumar
pedidos.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)
```

**Archivo Modificado:**
- `frontend/src/pages/InformePedidosScreen.jsx`

---

#### 3. Ajustes de UI en Modal de Pedidos

**Cambios Realizados:**

1. **Tamaño de texto del resumen:**
   - Aumentado de 13px a 19px para mejor visibilidad
   - Aplicado a la clase `.payment-method-amount`

2. **Espaciado del footer:**
   - Reducido margin-top y padding-top
   - Eliminado border-top para diseño más limpio

3. **Altura del contenedor de resumen:**
   - Cambiado de `height: 100%` a `height: auto`
   - Reducido padding para optimizar espacio

**Archivo Modificado:**
- `frontend/src/components/Pedidos/PaymentModal.css`

---

#### 4. Integración con Planeación de Producción

**Funcionalidad:** Los pedidos ahora se reflejan automáticamente en la planeación de producción.

**Flujo de Trabajo:**
1. Se crea un pedido con fecha de entrega
2. El pedido se guarda en la BD con sus detalles
3. Al abrir Planeación → seleccionar fecha, se cargan automáticamente:
   - Cantidades solicitadas (desde Cargue)
   - Cantidades de pedidos (suma de todos los pedidos para esa fecha)
4. La columna "PEDIDOS" muestra la suma de unidades por producto

**Función de Carga:**
```javascript
const cargarPedidosDesdeBD = async (fechaSeleccionada) => {
    const response = await fetch(`http://localhost:8000/api/pedidos/`);
    const pedidos = await response.json();
    
    // Filtrar por fecha de entrega
    const pedidosFecha = pedidos.filter(p => p.fecha_entrega === fechaFormateada);
    
    // Sumar cantidades por producto
    const pedidosMap = {};
    for (const pedido of pedidosFecha) {
        if (pedido.detalles && pedido.detalles.length > 0) {
            for (const detalle of pedido.detalles) {
                const nombreProducto = detalle.producto_nombre;
                if (!pedidosMap[nombreProducto]) {
                    pedidosMap[nombreProducto] = 0;
                }
                pedidosMap[nombreProducto] += detalle.cantidad;
            }
        }
    }
    return pedidosMap;
};
```

**Archivos Modificados:**
- `frontend/src/components/inventario/InventarioPlaneacion.jsx`

---

#### 5. Toggle "Volver a Gestión del Día"

**Funcionalidad:** Botón deslizante (toggle switch) en el carrito que permite volver automáticamente a la gestión de pedidos del día después de crear un pedido.

**Comportamiento:**
- **Toggle OFF (por defecto):** Después de crear el pedido, resetea el formulario (limpia carrito, vuelve a valores por defecto)
- **Toggle ON:** Después de crear el pedido exitosamente, redirige automáticamente a la gestión de pedidos del día/fecha que se estaba trabajando

**Implementación:**

**Cart.jsx:**
```javascript
const [volverGestion, setVolverGestion] = useState(false);

// Toggle en el footer del carrito
<div className="d-flex align-items-center justify-content-between mb-2">
    <span style={{ color: '#666' }}>Volver a gestión del día</span>
    <div className="form-check form-switch">
        <input
            className="form-check-input"
            type="checkbox"
            checked={volverGestion}
            onChange={(e) => setVolverGestion(e.target.checked)}
        />
    </div>
</div>
```

**PaymentModal.jsx:**
```javascript
// Después de crear el pedido exitosamente
if (volverGestion && date && navigate) {
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const fechaObj = new Date(date + 'T00:00:00');
    const dia = diasSemana[fechaObj.getDay()];
    navigate(`/pedidos/${dia}?fecha=${date}`);
}
```

**Archivos Modificados:**
- `frontend/src/components/Pedidos/Cart.jsx`
- `frontend/src/components/Pedidos/PaymentModal.jsx`

**Ruta de Navegación:**
- Formato: `/pedidos/SABADO?fecha=2025-10-11`
- Lleva directamente a la pantalla de gestión de pedidos del día con la fecha seleccionada

---

#### 6. Reset Completo del Formulario

**Problema:** Después de crear un pedido, algunos datos del cliente permanecían en el formulario.

**Solución:**

**PedidosScreen.jsx:**
```javascript
const resetForm = () => {
    setClient("DESTINATARIO GENERAL");
    setSeller("PEDIDOS");
    setPriceList("CLIENTES");
    setDate(getFechaLocal());
    setClientData(null);  // ← Agregado para limpiar datos del cliente
    clearCart();
};
```

**PaymentModal.jsx:**
```javascript
// Reset de todos los estados del modal
setDestinatario("DESTINATARIO GENERAL");
setDireccionEntrega("");
setTelefonoContacto("");
const mañana = new Date();
mañana.setDate(mañana.getDate() + 1);
setFechaEntrega(mañana.toISOString().split('T')[0]);
setNota("");
setTipoRemision("ENTREGA");
setTransportadora("Propia");
```

**Archivos Modificados:**
- `frontend/src/pages/PedidosScreen.jsx`
- `frontend/src/components/Pedidos/PaymentModal.jsx`

---

### Resumen de Mejoras

✅ **Corrección de fechas:** Eliminados problemas de zona horaria
✅ **Cálculos correctos:** Suma de totales funciona correctamente
✅ **UI mejorada:** Mejor visibilidad y espaciado en modales
✅ **Integración con planeación:** Los pedidos se reflejan automáticamente
✅ **Flujo de trabajo optimizado:** Toggle para volver rápidamente a gestión del día
✅ **Reset completo:** Formulario se limpia correctamente después de cada pedido

---

### Próximas Mejoras Sugeridas

- [ ] Agregar validación de stock antes de crear pedido
- [ ] Implementar notificaciones toast en lugar de alerts
- [ ] Agregar filtros avanzados en el informe de pedidos
- [ ] Exportar informe de pedidos a Excel/PDF
- [ ] Agregar historial de cambios de estado de pedidos



---

## MÓDULO DE GESTIÓN DE PEDIDOS

### Descripción General
Sistema completo para gestionar pedidos de clientes organizados por día de entrega, con integración automática a Planeación de Inventario y Cargue de Vendedores.

### Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── PedidosScreen.jsx                    # Formulario de creación de pedidos
│   ├── SelectorDiasPedidosScreen.jsx        # Selector de días (Lunes-Sábado)
│   ├── PedidosDiaScreen.jsx                 # Vista de clientes por día
│   └── InformePedidosScreen.jsx             # Informe general de pedidos
├── components/Pedidos/
│   ├── Sidebar.jsx                          # Menú lateral
│   ├── Topbar.jsx                           # Barra superior
│   ├── ProductList.jsx                      # Lista de productos
│   ├── Cart.jsx                             # Carrito de compras
│   ├── ConsumerForm.jsx                     # Formulario de destinatario
│   ├── PaymentModal.jsx                     # Modal de confirmación
│   └── ModalDetallePedido.jsx               # Modal de detalle de pedido
├── context/
│   └── CajeroPedidosContext.jsx             # Contexto de autenticación
└── services/
    └── api.js                               # Servicio de API (pedidoService)
```

---

### Componentes Principales

#### 1. SelectorDiasPedidosScreen.jsx
**Ruta:** `/pedidos`

**Función:** Selector de días de la semana para gestión de pedidos

**Características:**
- Botones para cada día (LUNES-SÁBADO)
- Navegación a `/pedidos/:dia`
- Botón de regreso a remisiones

**Código:**
```jsx
const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function SelectorDiasPedidosScreen() {
  const navigate = useNavigate();

  const handleDayClick = (dia) => {
    navigate(`/pedidos/${dia}`);
  };

  return (
    <div className="selector-dia-container">
      {dias.map((dia) => (
        <button 
          key={dia}
          onClick={() => handleDayClick(dia)}
        >
          {dia}
        </button>
      ))}
    </div>
  );
}
```

---

#### 2. PedidosDiaScreen.jsx
**Ruta:** `/pedidos/:dia`

**Función:** Muestra clientes del día seleccionado con estado de pedidos

**Características:**
- ✅ Carga clientes filtrados por `dia_entrega`
- ✅ Selector de fecha para filtrar pedidos
- ✅ Tabla de clientes con información resumida
- ✅ Botón "Crear Pedido" o estado "Realizado"
- ✅ Modal de detalle al hacer clic en pedido realizado
- ✅ Función de anular pedido
- ✅ Drag & drop para reordenar clientes
- ✅ Campo de notas por cliente
- ✅ Recarga automática al recuperar foco

**Código clave:**
```jsx
const cargarClientes = async () => {
  const response = await fetch(`${API_URL}/clientes/`);
  const data = await response.json();
  
  // Filtrar clientes por día de entrega
  const clientesFiltrados = data.filter(
    cliente => cliente.dia_entrega === dia && cliente.activo
  );
  
  setClientes(clientesFiltrados);
};

const cargarPedidos = async () => {
  const response = await fetch(`${API_URL}/pedidos/`);
  const pedidos = await response.json();
  
  // Filtrar por fecha de entrega Y excluir anulados
  const pedidosFiltradas = pedidos.filter(r =>
    r.fecha_entrega === fechaSeleccionada && r.estado !== 'ANULADA'
  );
  
  // Crear mapa de pedidos por cliente
  const pedidosMap = {};
  pedidosFiltradas.forEach(pedido => {
    pedidosMap[pedido.destinatario.toLowerCase()] = pedido;
  });
  
  setPedidosRealizados(pedidosMap);
};

const anularPedido = async (cliente) => {
  const pedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];
  
  const confirmar = window.confirm(
    `¿Estás seguro de anular el pedido de ${cliente.nombre_completo}?`
  );
  
  if (!confirmar) return;
  
  const response = await fetch(
    `${API_URL}/pedidos/${pedido.id}/anular/`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );
  
  if (response.ok) {
    alert('Pedido anulado exitosamente');
    cargarPedidos(); // Recargar para actualizar vista
  }
};
```

**Tabla de clientes:**
```jsx
<table>
  <thead>
    <tr>
      <th>Cliente</th>
      <th>Vendedor</th>
      <th>Dirección</th>
      <th>Lista Precio</th>
      <th>Estado</th>
      <th>Anular</th>
      <th>Notas</th>
    </tr>
  </thead>
  <tbody>
    {clientesOrdenados.map((cliente) => {
      const tienePedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];
      
      return (
        <tr 
          key={cliente.id}
          onClick={() => handleRowClick(cliente)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        >
          <td>{cliente.nombre_completo}</td>
          <td>{cliente.vendedor_asignado}</td>
          <td>{cliente.direccion}</td>
          <td>{cliente.tipo_lista_precio}</td>
          <td>
            {tienePedido ? (
              <span className="badge-success">Realizado</span>
            ) : (
              <span className="badge-pending">Pendiente</span>
            )}
          </td>
          <td>
            {tienePedido && (
              <button onClick={(e) => {
                e.stopPropagation();
                anularPedido(cliente);
              }}>
                ✕
              </button>
            )}
          </td>
          <td>
            <input
              type="text"
              value={notas[cliente.id] || ''}
              onChange={(e) => handleNotaChange(cliente.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

---

#### 3. PedidosScreen.jsx
**Ruta:** `/remisiones`

**Función:** Formulario principal para crear pedidos

**Características:**
- ✅ Recibe datos del cliente por URL params
- ✅ Precarga: nombre, dirección, vendedor, lista de precios, fecha
- ✅ Lista de productos con precios según lista del cliente
- ✅ Carrito de compras con cálculo de totales
- ✅ Modal de confirmación con todos los datos
- ✅ Reseteo de formulario después de crear pedido
- ✅ Opción de volver a gestión del día

**Código clave:**
```jsx
function PedidosScreenContent() {
  const { cajeroLogueado, isAuthenticated } = useCajeroPedidos();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [date, setDate] = useState(getFechaLocal());
  const [seller, setSeller] = useState("PEDIDOS");
  const [client, setClient] = useState("DESTINATARIO GENERAL");
  const [clientData, setClientData] = useState(null);

  // Cargar datos del cliente desde URL
  useEffect(() => {
    const clienteParam = searchParams.get('cliente');
    if (clienteParam) {
      const clienteData = JSON.parse(decodeURIComponent(clienteParam));
      setClientData(clienteData);
      setClient(clienteData.nombre);
      if (clienteData.lista_precio) setPriceList(clienteData.lista_precio);
      if (clienteData.fecha) setDate(clienteData.fecha);
      if (clienteData.vendedor) setSeller(clienteData.vendedor);
    }
  }, [searchParams]);

  const addProduct = (product, currentPrice = null) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      const priceToUse = currentPrice !== null ? currentPrice : product.price;
      return [...prev, { ...product, price: priceToUse, qty: 1 }];
    });
  };

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const total = Math.max(0, subtotal + Number(imp) - Number(desc));

  return (
    <div className="pedidos-screen">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="row">
          <div className="col-lg-7">
            <ProductList
              addProduct={addProduct}
              search={search}
              setSearch={setSearch}
              priceList={priceList}
            />
          </div>
          <div className="col-lg-5">
            <ConsumerForm
              date={date}
              seller={seller}
              client={client}
              priceList={priceList}
              setDate={setDate}
              setSeller={setSeller}
              setClient={setClient}
              setPriceList={setPriceList}
            />
            <Cart
              cart={cart}
              removeProduct={removeProduct}
              changeQty={changeQty}
              subtotal={subtotal}
              total={total}
              seller={seller}
              client={client}
              clientData={clientData}
              clearCart={clearCart}
              resetForm={resetForm}
              date={date}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### 4. PaymentModal.jsx
**Ubicación:** `frontend/src/components/Pedidos/PaymentModal.jsx`

**Función:** Modal de confirmación y creación de pedido

**Características:**
- ✅ Muestra resumen del pedido
- ✅ Formulario de datos de entrega
- ✅ Selector de tipo de pedido (Entrega, Traslado, Devolución, Muestra)
- ✅ Selector de transportadora
- ✅ Validación de campos requeridos
- ✅ Conversión de precios a números con `parseFloat()`
- ✅ Llamada a API para crear pedido
- ✅ Opción de volver a gestión del día

**Código clave:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  if (!destinatario.trim() || !direccionEntrega.trim()) {
    alert('Debe especificar destinatario y dirección');
    return;
  }

  setProcessing(true);

  try {
    const pedidoData = {
      fecha: getFechaLocal(),
      vendedor: seller,
      destinatario: destinatario,
      direccion_entrega: direccionEntrega,
      telefono_contacto: telefonoContacto,
      fecha_entrega: fechaEntrega,
      tipo_remision: tipoPedido,
      transportadora: transportadora,
      subtotal: subtotal,
      impuestos: impuestos,
      descuentos: descuentos,
      total: safeTotal,
      estado: 'PENDIENTE',
      nota: nota,
      detalles: cart.map(item => ({
        producto: item.id,
        cantidad: item.qty,
        precio_unitario: parseFloat(item.price)  // ✅ IMPORTANTE
      }))
    };

    // Crear el pedido
    const result = await pedidoService.create(pedidoData);

    if (result && !result.error) {
      alert(`¡Pedido generado exitosamente!\nNúmero: ${result.numero_pedido}`);
      
      // Resetear formulario
      resetForm();
      onClose();

      // Si el toggle está activado, navegar a gestión del día
      if (volverGestion && date && navigate) {
        const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        const fechaObj = new Date(date + 'T00:00:00');
        const dia = diasSemana[fechaObj.getDay()];
        navigate(`/pedidos/${dia}?fecha=${date}`);
      }
    } else {
      alert('Error al generar el pedido');
    }
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    alert('Error al generar el pedido');
  } finally {
    setProcessing(false);
  }
};
```

---

### Integración con Planeación

#### InventarioPlaneacion.jsx
**Ubicación:** `frontend/src/components/inventario/InventarioPlaneacion.jsx`

**Función:** Carga pedidos y los suma por producto para mostrar en columna "Pedidos"

**Código clave:**
```jsx
const cargarPedidosDesdeBD = async (fechaSeleccionada) => {
  try {
    const fechaFormateada = formatearFecha(fechaSeleccionada);
    
    const response = await fetch(`${API_URL}/pedidos/`);
    const pedidos = await response.json();

    // ✅ Filtrar por fecha de entrega Y excluir anulados
    const pedidosFecha = pedidos.filter(p => 
      p.fecha_entrega === fechaFormateada && p.estado !== 'ANULADA'
    );

    // Sumar cantidades por producto
    const pedidosMap = {};
    for (const pedido of pedidosFecha) {
      if (pedido.detalles && pedido.detalles.length > 0) {
        for (const detalle of pedido.detalles) {
          const nombreProducto = detalle.producto_nombre;
          if (!pedidosMap[nombreProducto]) {
            pedidosMap[nombreProducto] = 0;
          }
          pedidosMap[nombreProducto] += detalle.cantidad;
        }
      }
    }

    return pedidosMap;
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    return {};
  }
};

// Usar en la carga de productos
const productosConPlaneacion = productosFromBD.map(p => {
  const pedidosProducto = pedidosMap[p.nombre] || 0;
  
  return {
    id: p.id,
    nombre: p.nombre,
    existencias: p.stock_total || 0,
    solicitado: solicitadoFinal,
    pedidos: pedidosProducto,  // ✅ Cantidad de pedidos
    orden: 0,
    ia: 0
  };
});
```

**Tabla de Planeación:**
```jsx
<table>
  <thead>
    <tr>
      <th>Producto</th>
      <th>Existencias</th>
      <th>Solicitadas</th>
      <th>Pedidos</th>  {/* ← Columna de pedidos */}
      <th>Total</th>
      <th>Orden</th>
      <th>IA</th>
    </tr>
  </thead>
  <tbody>
    {productos.map((producto) => {
      const total = (producto.solicitado || 0) + (producto.pedidos || 0);
      
      return (
        <tr key={producto.id}>
          <td>{producto.nombre}</td>
          <td>{producto.existencias}</td>
          <td>{producto.solicitado}</td>
          <td>{producto.pedidos}</td>  {/* ← Muestra pedidos */}
          <td>{total}</td>
          <td>{producto.orden}</td>
          <td>{producto.ia}</td>
        </tr>
      );
    })}
  </tbody>
</table>
```

---

### Integración con Cargue

#### PlantillaOperativa.jsx
**Ubicación:** `frontend/src/components/Cargue/PlantillaOperativa.jsx`

**Función:** Carga pedidos del vendedor y los suma para mostrar en "TOTAL PEDIDOS"

**Código clave:**
```jsx
const cargarPedidosDesdeBD = async (fecha, idVendedor) => {
  try {
    const fechaFormateada = formatearFecha(fecha);
    
    // Cargar todos los pedidos
    const response = await fetch('http://localhost:8000/api/pedidos/');
    const pedidos = await response.json();

    // Obtener el nombre del vendedor
    const { responsableStorage } = await import('../../utils/responsableStorage');
    const nombreVendedor = responsableStorage.get(idVendedor);

    // ✅ Filtrar por fecha, vendedor Y excluir anulados
    const pedidosFiltrados = pedidos.filter(pedido => {
      const coincideFecha = pedido.fecha_entrega === fechaFormateada;
      const noAnulado = pedido.estado !== 'ANULADA';  // ✅ IMPORTANTE
      
      let coincideVendedor = false;
      if (pedido.vendedor) {
        if (pedido.vendedor.includes(`(${idVendedor})`)) {
          coincideVendedor = true;
        } else if (nombreVendedor && pedido.vendedor.trim() === nombreVendedor.trim()) {
          coincideVendedor = true;
        }
      }

      return coincideFecha && coincideVendedor && noAnulado;
    });

    // Sumar el total de los pedidos
    const totalPedidos = pedidosFiltrados.reduce((sum, pedido) => {
      return sum + parseFloat(pedido.total || 0);
    }, 0);

    return totalPedidos;
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    return 0;
  }
};
```

**Resumen de Ventas:**
```jsx
<div className="resumen-ventas">
  <div className="bg-lightpink">
    <strong>TOTAL PEDIDOS:</strong>
    <div>{formatCurrency(datos.totalPedidos)}</div>  {/* ← Total de pedidos */}
  </div>
  
  <div className="bg-lightgreen">
    <strong>TOTAL EFECTIVO:</strong>
    <div>{formatCurrency(datos.totalEfectivo)}</div>  {/* ← Venta - Pedidos */}
  </div>
</div>
```

---

### Servicio de API

#### pedidoService
**Ubicación:** `frontend/src/services/api.js`

```javascript
export const pedidoService = {
  // Obtener todos los pedidos
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/pedidos/?${queryParams.toString()}`;
      
      // Intentar con API primero
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // Fallback: usar localStorage
      const pedidosGuardados = localStorage.getItem('pedidos_sistema');
      if (pedidosGuardados) {
        let pedidos = JSON.parse(pedidosGuardados);
        
        // Aplicar estados de pedidos anulados
        const pedidosAnulados = JSON.parse(localStorage.getItem('pedidos_anulados') || '[]');
        if (pedidosAnulados.length > 0) {
          pedidos = pedidos.map(pedido => {
            if (pedidosAnulados.includes(pedido.id)) {
              return { ...pedido, estado: 'ANULADA' };
            }
            return pedido;
          });
        }
        
        return pedidos;
      }
      
      return [];
    } catch (error) {
      console.error('Error en getAll pedidos:', error);
      return [];
    }
  },

  // Crear un nuevo pedido
  create: async (pedidoData) => {
    try {
      // Intentar con API primero
      const response = await fetch(`${API_URL}/pedidos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error(`Error al crear pedido: ${response.status}`);
      }
    } catch (error) {
      console.warn('API no disponible, guardando en localStorage:', error);
      
      // Fallback: guardar en localStorage
      const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos_sistema') || '[]');
      
      const nuevoId = Date.now();
      const numeroPedido = `PED-${String(nuevoId).slice(-6)}`;
      
      const nuevoPedido = {
        id: nuevoId,
        numero_pedido: numeroPedido,
        ...pedidoData,
        fecha_creacion: new Date().toISOString()
      };
      
      pedidosGuardados.push(nuevoPedido);
      localStorage.setItem('pedidos_sistema', JSON.stringify(pedidosGuardados));
      
      return nuevoPedido;
    }
  },

  // Obtener un pedido por ID
  getById: async (id) => {
    try {
      // Intentar con API primero
      const response = await fetch(`${API_URL}/pedidos/${id}/`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // Fallback: buscar en localStorage
      const pedidosGuardados = localStorage.getItem('pedidos_sistema');
      if (pedidosGuardados) {
        const pedidos = JSON.parse(pedidosGuardados);
        let pedido = pedidos.find(r => r.id === parseInt(id));
        
        if (pedido) {
          // Verificar si está anulado
          const pedidosAnulados = JSON.parse(localStorage.getItem('pedidos_anulados') || '[]');
          if (pedidosAnulados.includes(parseInt(id))) {
            pedido = { ...pedido, estado: 'ANULADA' };
          }
          
          return pedido;
        }
      }
      
      throw new Error('Pedido no encontrado');
    } catch (error) {
      console.error('Error en getById pedido:', error);
      return { error: true, message: error.message };
    }
  },

  // Anular un pedido
  anularPedido: async (id) => {
    try {
      // Intentar con API primero
      const response = await fetch(`${API_URL}/pedidos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'ANULADA' })
      });

      if (response.ok) {
        const result = await response.json();
        return { 
          success: true, 
          message: 'Pedido anulado exitosamente',
          pedido: result
        };
      }
    } catch (error) {
      console.warn('API no disponible, usando fallback local:', error);
    }

    // Fallback: marcar como anulado localmente
    const pedidosAnulados = JSON.parse(localStorage.getItem('pedidos_anulados') || '[]');
    if (!pedidosAnulados.includes(parseInt(id))) {
      pedidosAnulados.push(parseInt(id));
      localStorage.setItem('pedidos_anulados', JSON.stringify(pedidosAnulados));
    }
    
    return { 
      success: true, 
      message: 'Pedido anulado exitosamente (pendiente sincronización)',
      pedido: { id: parseInt(id), estado: 'ANULADA' }
    };
  }
};
```

---

### Flujo Completo de Creación de Pedido

```
1. Usuario selecciona día (ej: SABADO)
   ↓
2. Sistema muestra clientes con dia_entrega = SABADO
   ↓
3. Usuario hace clic en "Crear Pedido" para cliente PRUEBA3
   ↓
4. Sistema navega a /remisiones con datos del cliente en URL:
   ?cliente={"nombre":"PRUEBA3","direccion":"Cll 134","vendedor":"Carlos","fecha":"2025-10-18"}
   ↓
5. PedidosScreen precarga datos del cliente
   ↓
6. Usuario agrega productos al carrito
   ↓
7. Usuario hace clic en "Generar Pedido"
   ↓
8. PaymentModal valida datos y crea pedidoData
   ↓
9. pedidoService.create() envía POST /api/pedidos/
   ↓
10. Backend (PedidoSerializer.create):
    - Crea Pedido
    - Crea DetallePedido
    - Actualiza Planeación (suma cantidades)
    - Actualiza Cargue (suma dinero)
   ↓
11. Frontend recibe respuesta con numero_pedido
   ↓
12. Sistema muestra alerta de éxito
   ↓
13. Si toggle activado, navega a /pedidos/SABADO?fecha=2025-10-18
   ↓
14. PedidosDiaScreen recarga y muestra pedido como "Realizado"
```

---

### Flujo Completo de Anulación de Pedido

```
1. Usuario ve pedido en estado "Realizado"
   ↓
2. Usuario hace clic en botón "Anular" (✕)
   ↓
3. Sistema muestra confirmación
   ↓
4. Usuario confirma anulación
   ↓
5. pedidoService.anularPedido() envía POST /api/pedidos/{id}/anular/
   ↓
6. Backend (PedidoViewSet.anular):
    - Cambia estado a ANULADA
    - Resta cantidades en Planeación
    - Resta dinero en Cargue
    - Agrega nota con motivo
   ↓
7. Frontend recibe respuesta de éxito
   ↓
8. Sistema muestra alerta de éxito
   ↓
9. cargarPedidos() recarga datos
   ↓
10. Sistema muestra pedido como "Pendiente" (porque está anulado)
```

---

### Consideraciones Importantes

#### 1. Filtrado de Pedidos Anulados
**CRÍTICO:** Siempre filtrar pedidos anulados al calcular totales:
```javascript
const pedidosActivos = pedidos.filter(p => p.estado !== 'ANULADA');
```

#### 2. Conversión de Precios
**IMPORTANTE:** Convertir precios a números antes de enviar:
```javascript
precio_unitario: parseFloat(item.price)
```

#### 3. Formato de Fecha
**IMPORTANTE:** Usar formato YYYY-MM-DD para fecha_entrega:
```javascript
const fechaFormateada = `${year}-${month}-${day}`;
```

#### 4. Recarga Automática
**RECOMENDADO:** Recargar pedidos al recuperar foco:
```javascript
useEffect(() => {
  const handleFocus = () => cargarPedidos();
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

---

### Troubleshooting

#### Problema: Pedidos anulados se siguen sumando
**Solución:** Verificar filtro `estado !== 'ANULADA'` en:
- `InventarioPlaneacion.jsx` (línea ~48)
- `PlantillaOperativa.jsx` (línea ~227)

#### Problema: Total duplicado en Cargue
**Causa:** No se está filtrando por estado anulado
**Solución:** Agregar filtro `noAnulado` en PlantillaOperativa.jsx

#### Problema: Pedido no aparece en Planeación
**Causa:** Fecha de entrega no coincide
**Solución:** Verificar formato de fecha (YYYY-MM-DD)

#### Problema: Datos del cliente no se precargan
**Causa:** URL params mal formateados
**Solución:** Usar `encodeURIComponent(JSON.stringify(clienteData))`
