import React, { createContext, useState, useContext, useEffect } from 'react';
import productosIniciales from '../data/productos';
import { syncService, sincronizarConBD } from '../services/syncService';
import { productoService, movimientoService } from '../services/api';

const ProductosContext = createContext();

export const useProductos = () => useContext(ProductosContext);

export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Utilidades
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (key === 'productos') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('productosUpdated'));
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const getFromLocalStorage = (key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  };

  // Sincronizar stock desde BD
  const syncStockFromBD = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/productos/`);
      if (!response.ok) return;

      const productosFromBD = await response.json();
      const posProducts = getFromLocalStorage('products', []);

      const updatedPosProducts = posProducts.map(posProduct => {
        const productoBD = productosFromBD.find(p => p.id === posProduct.id);
        return productoBD
          ? { ...posProduct, stock: productoBD.stock_total }
          : posProduct;
      });

      saveToLocalStorage('products', updatedPosProducts);
    } catch (error) {
      console.error('Error syncing stock from BD:', error);
    }
  };

  // Sincronizar productos POS con inventario
  const syncPOSWithInventory = () => {
    try {
      const posProducts = getFromLocalStorage('products', []);
      if (posProducts.length === 0) return;

      const convertedPosProducts = posProducts.map(posProduct => ({
        id: posProduct.id,
        nombre: posProduct.name.toUpperCase(),
        existencias: posProduct.stock || 0,
        categoria: posProduct.category || 'General',
        cantidad: 0,
        precio: posProduct.price || 0
      }));

      const inventoryProducts = getFromLocalStorage('productos', []);
      const combinedProducts = [...inventoryProducts];

      convertedPosProducts.forEach(posProduct => {
        const existingIndex = combinedProducts.findIndex(p => p.id === posProduct.id);
        if (existingIndex >= 0) {
          combinedProducts[existingIndex] = {
            ...combinedProducts[existingIndex],
            ...posProduct
          };
        } else {
          combinedProducts.push(posProduct);
        }
      });

      saveToLocalStorage('productos', combinedProducts);
    } catch (error) {
      console.error('Error syncing POS with inventory:', error);
    }
  };

  // Cargar datos iniciales
  const loadInitialData = () => {
    try {
      const productosGuardados = getFromLocalStorage('productos');

      if (productosGuardados.length > 0) {
        // Combinar productos iniciales con guardados
        const productosCompletos = productosIniciales.map(productoInicial => {
          const productoGuardado = productosGuardados.find(p => p.id === productoInicial.id);
          return productoGuardado
            ? { ...productoInicial, ...productoGuardado, categoria: productoInicial.categoria }
            : productoInicial;
        });

        // Incluir productos del POS no iniciales
        const productosDelPOS = productosGuardados.filter(
          p => !productosIniciales.some(pi => pi.id === p.id)
        );

        setProductos([...productosCompletos, ...productosDelPOS]);
      } else {
        setProductos(productosIniciales);
      }

      // Cargar movimientos
      const movimientosGuardados = getFromLocalStorage('movimientos');
      if (movimientosGuardados.length > 0) {
        setMovimientos(movimientosGuardados);
      } else {
        const movimientosIniciales = [
          {
            id: 1,
            fecha: '2023-05-10',
            hora: '10:30',
            producto: 'AREPA TIPO OBLEA',
            cantidad: 5,
            tipo: 'Entrada',
            usuario: 'Admin',
            lote: 'L001',
            fechaVencimiento: '10/11/2023'
          },
          {
            id: 2,
            fecha: '2023-05-09',
            hora: '15:45',
            producto: 'AREPA MEDIANA',
            cantidad: 3,
            tipo: 'Salida',
            usuario: 'Usuario',
            lote: 'L002',
            fechaVencimiento: '-'
          },
        ];
        setMovimientos(movimientosIniciales);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setProductos(productosIniciales);
      setMovimientos([]);
    }
  };

  // Inicialización
  useEffect(() => {
    syncStockFromBD();
    syncPOSWithInventory();
    loadInitialData();

    // Configurar sincronización periódica
    const syncInterval = setInterval(() => {
      syncService.processSyncQueue();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  // Actualizar existencias
  const actualizarExistencias = (productosActualizados) => {
    setProductos(productosActualizados);
    saveToLocalStorage('productos', productosActualizados);

    // Sincronizar con POS
    try {
      const posProducts = getFromLocalStorage('products', []);
      const updatedPosProducts = posProducts.map(posProduct => {
        const inventoryProduct = productosActualizados.find(p => p.id === posProduct.id);
        return inventoryProduct
          ? { ...posProduct, stock: inventoryProduct.existencias }
          : posProduct;
      });

      saveToLocalStorage('products', updatedPosProducts);
    } catch (error) {
      console.error('Error syncing with POS:', error);
    }

    // Sincronizar con backend
    productosActualizados.forEach(async (producto) => {
      try {
        await productoService.update(producto.id, {
          stock_total: producto.existencias
        });
      } catch (error) {
        console.error(`Error updating stock for ${producto.nombre}:`, error);
        syncService.queueOperation('PRODUCT_UPDATE_STOCK_DIRECT', {
          id: producto.id,
          stock_total: producto.existencias,
          usuario: 'Sistema Inventario',
          nota: 'Actualización directa desde inventario'
        });
      }
    });
  };

  // Agregar movimientos
  const agregarMovimientos = (nuevosMovimientos) => {
    setMovimientos(prevMovimientos => {
      // Filtrar duplicados
      const movimientosNoRepetidos = nuevosMovimientos.filter(
        nuevoMov => !prevMovimientos.some(prevMov => prevMov.id === nuevoMov.id)
      );

      const movimientosActualizados = [...movimientosNoRepetidos, ...prevMovimientos];
      saveToLocalStorage('movimientos', movimientosActualizados);

      return movimientosActualizados;
    });
  };

  // Sincronizar con backend
  const sincronizarConBackend = async () => {
    setIsSyncing(true);
    try {
      // Cargar productos desde backend
      const backendProductos = await productoService.getAll();
      const productosFormateados = backendProductos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre.toUpperCase(),
        existencias: producto.stock_total,
        categoria: producto.categoria_nombre || 'General',
        cantidad: 0,
        precio: producto.precio
      }));

      setProductos(productosFormateados);
      saveToLocalStorage('productos', productosFormateados);

      // Cargar movimientos desde backend
      try {
        const backendMovimientos = await movimientoService.getAll();
        const movimientosFormateados = backendMovimientos.map(movimiento => ({
          id: movimiento.id,
          fecha: new Date(movimiento.fecha).toLocaleDateString('es-ES'),
          hora: new Date(movimiento.fecha).toLocaleTimeString('es-ES'),
          producto: movimiento.producto_nombre,
          cantidad: movimiento.cantidad,
          tipo: movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
          usuario: movimiento.usuario,
          lote: movimiento.lote_codigo || '-',
          fechaVencimiento: '-',
          registrado: true
        }));

        const movimientosLocales = getFromLocalStorage('movimientos', []);
        const backendMovimientosIds = new Set(backendMovimientos.map(m => m.id));

        const movimientosLocalesUnicos = movimientosLocales.filter(
          m => !backendMovimientosIds.has(m.id) && m.id.toString().includes('-')
        );

        const movimientosCombinados = [...movimientosFormateados, ...movimientosLocalesUnicos];
        setMovimientos(movimientosCombinados);
        saveToLocalStorage('movimientos', movimientosCombinados);
      } catch (error) {
        console.error('Error loading movements from backend:', error);
        const movimientosLocales = getFromLocalStorage('movimientos', []);
        setMovimientos(movimientosLocales);
      }

      return true;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    productos,
    movimientos,
    actualizarExistencias,
    agregarMovimientos,
    sincronizarConBackend,
    isSyncing
  };

  return (
    <ProductosContext.Provider value={value}>
      {children}
    </ProductosContext.Provider>
  );
};

export default ProductosContext;