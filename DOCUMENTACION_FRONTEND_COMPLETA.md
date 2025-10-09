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
