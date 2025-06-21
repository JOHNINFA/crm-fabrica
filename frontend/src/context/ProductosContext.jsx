import React, { createContext, useState, useContext, useEffect } from 'react';
import productosIniciales from '../data/productos';
import { syncService } from '../services/syncService';
import { productoService, movimientoService } from '../services/api';

// Crear el contexto
const ProductosContext = createContext();

// Hook personalizado para usar el contexto
export const useProductos = () => useContext(ProductosContext);

// Proveedor del contexto
export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  // Efecto para intentar sincronizar con el backend al iniciar
  useEffect(() => {
    // DESHABILITADO: Sincronización automática al iniciar para evitar sobrescribir datos locales
    // const syncWithBackend = async () => {
    //   try {
    //     await sincronizarConBackend();
    //   } catch (error) {
    //     console.log('Usando datos locales, backend no disponible');
    //   }
    // };
    // syncWithBackend();
    console.log('Sincronización automática al iniciar deshabilitada');
    
    // Procesamiento de cola de sincronización (frecuencia normal)
    const syncInterval = setInterval(() => {
      console.log('Procesando cola de sincronización...');
      syncService.processSyncQueue();
    }, 30000); // Procesar cada 30 segundos
    
    return () => {
      clearInterval(syncInterval);
    };
  }, []);
  
  // Función para sincronizar stock desde BD
  const syncStockFromBD = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/productos/');
      if (response.ok) {
        const productosFromBD = await response.json();
        
        // Actualizar localStorage de products (POS) con stock real
        const posProductsStr = localStorage.getItem('products');
        if (posProductsStr) {
          const posProducts = JSON.parse(posProductsStr);
          const updatedPosProducts = posProducts.map(posProduct => {
            const productoBD = productosFromBD.find(p => p.id === posProduct.id);
            if (productoBD) {
              return {
                ...posProduct,
                stock: productoBD.stock_total
              };
            }
            return posProduct;
          });
          
          localStorage.setItem('products', JSON.stringify(updatedPosProducts));
          console.log('✅ Stock sincronizado desde BD para POS');
        }
      }
    } catch (error) {
      console.error('Error al sincronizar stock desde BD:', error);
    }
  };
  
  // Cargar datos iniciales y persistir estado
  useEffect(() => {
    // Sincronizar stock desde BD al iniciar
    syncStockFromBD();
    // Sincronizar productos del POS al inventario manualmente
    try {
      // Obtener productos del POS desde localStorage
      const posProductsStr = localStorage.getItem('products');
      if (posProductsStr) {
        const posProducts = JSON.parse(posProductsStr);
        
        // Convertir productos del POS al formato de inventario
        const convertedPosProducts = posProducts.map(posProduct => ({
          id: posProduct.id,
          nombre: posProduct.name.toUpperCase(),
          existencias: posProduct.stock || 0,
          categoria: posProduct.category || 'General',
          cantidad: 0,
          precio: posProduct.price || 0
        }));
        
        // Obtener productos de inventario desde localStorage
        const inventoryProductsStr = localStorage.getItem('productos');
        const inventoryProducts = inventoryProductsStr ? JSON.parse(inventoryProductsStr) : [];
        
        // Combinar productos, evitando duplicados por ID
        const combinedProducts = [...inventoryProducts];
        
        convertedPosProducts.forEach(posProduct => {
          const existingIndex = combinedProducts.findIndex(p => p.id === posProduct.id);
          if (existingIndex >= 0) {
            // Actualizar producto existente
            combinedProducts[existingIndex] = {
              ...combinedProducts[existingIndex],
              nombre: posProduct.nombre,
              existencias: posProduct.existencias,
              categoria: posProduct.categoria,
              precio: posProduct.precio
            };
          } else {
            // Agregar nuevo producto
            combinedProducts.push(posProduct);
          }
        });
        
        // Guardar productos combinados en localStorage
        localStorage.setItem('productos', JSON.stringify(combinedProducts));
      }
    } catch (error) {
      console.error('Error al sincronizar productos:', error);
    }
    
    // Intentar cargar productos y movimientos desde localStorage
    try {
      const productosGuardados = localStorage.getItem('productos');
      const movimientosGuardados = localStorage.getItem('movimientos');
      
      if (productosGuardados) {
        // Verificar que todos los productos iniciales estén presentes
        const productosGuardadosObj = JSON.parse(productosGuardados);
        
        // Asegurarse de que todos los productos iniciales estén incluidos
        const productosCompletos = productosIniciales.map(productoInicial => {
          const productoGuardado = productosGuardadosObj.find(p => p.id === productoInicial.id);
          if (productoGuardado) {
            // Mantener los datos guardados pero asegurar que tenga todos los campos del inicial
            return {
              ...productoInicial,
              ...productoGuardado,
              // Asegurar que la categoría se mantenga del inicial
              categoria: productoInicial.categoria
            };
          }
          return productoInicial;
        });
        
        // Incluir productos del POS que no estén en los productos iniciales
        const productosDelPOS = productosGuardadosObj.filter(
          p => !productosIniciales.some(pi => pi.id === p.id)
        );
        
        setProductos([...productosCompletos, ...productosDelPOS]);
      } else {
        setProductos(productosIniciales);
      }
      
      if (movimientosGuardados) {
        setMovimientos(JSON.parse(movimientosGuardados));
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
      console.error('Error al cargar datos desde localStorage:', error);
      setProductos(productosIniciales);
      setMovimientos([]);
    }
  }, []);

  // Función para actualizar existencias
  const actualizarExistencias = (productosActualizados) => {
    setProductos(productosActualizados);
    
    // Guardar en localStorage
    try {
      localStorage.setItem('productos', JSON.stringify(productosActualizados));
      
      // SINCRONIZACIÓN CON POS: Actualizar existencias en el sistema POS
      try {
        const posProductsStr = localStorage.getItem('products');
        if (posProductsStr) {
          const posProducts = JSON.parse(posProductsStr);
          
          const updatedPosProducts = posProducts.map(posProduct => {
            const inventoryProduct = productosActualizados.find(p => p.id === posProduct.id);
            if (inventoryProduct) {
              console.log(`Sincronizando existencias: ${posProduct.name} - Stock anterior: ${posProduct.stock} - Stock nuevo: ${inventoryProduct.existencias}`);
              return {
                ...posProduct,
                stock: inventoryProduct.existencias
              };
            }
            return posProduct;
          });
          
          localStorage.setItem('products', JSON.stringify(updatedPosProducts));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('productosUpdated'));
          
          console.log('Existencias sincronizadas correctamente con el POS');
        }
      } catch (error) {
        console.error('Error al sincronizar existencias con POS:', error);
      }
      
      // Sincronizar stock total directamente con el backend (automático)
      productosActualizados.forEach(async (producto) => {
        try {
          // Sincronizar directamente con el backend sin cola
          await productoService.update(producto.id, {
            stock_total: producto.existencias
          });
          console.log(`Stock actualizado en backend: ${producto.nombre} = ${producto.existencias}`);
        } catch (error) {
          console.error(`Error al actualizar stock en backend para ${producto.nombre}:`, error);
          // Si falla, encolar para reintento
          syncService.queueOperation('PRODUCT_UPDATE_STOCK_DIRECT', {
            id: producto.id,
            stock_total: producto.existencias,
            usuario: 'Sistema Inventario',
            nota: 'Actualización directa desde inventario'
          });
        }
      });
    } catch (error) {
      console.error('Error al guardar productos en localStorage:', error);
    }
  };

  // Función para agregar movimientos
  const agregarMovimientos = (nuevosMovimientos) => {
    // Verificar si hay movimientos duplicados antes de agregarlos
    setMovimientos(prevMovimientos => {
      // Filtrar movimientos que ya existen (mismo id)
      const movimientosNoRepetidos = nuevosMovimientos.filter(
        nuevoMov => !prevMovimientos.some(prevMov => prevMov.id === nuevoMov.id)
      );
      
      const movimientosActualizados = [...movimientosNoRepetidos, ...prevMovimientos];
      
      // Guardar en localStorage
      try {
        localStorage.setItem('movimientos', JSON.stringify(movimientosActualizados));
      } catch (error) {
        console.error('Error al guardar movimientos en localStorage:', error);
      }
      
      // Sincronizar stock total directamente con el backend (sin movimientos)
      // Solo sincronizar productos que han cambiado
      console.log('Sincronización directa de stock con backend habilitada');
      
      return movimientosActualizados;
    });
  };

  // Estado para controlar si estamos sincronizando con el backend
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Función para sincronizar manualmente con el backend
  const sincronizarConBackend = async () => {
    setIsSyncing(true);
    try {
      // Intentar cargar productos desde el backend
      const backendProductos = await productoService.getAll();
      
      // Convertir productos del backend al formato de inventario
      const productosFormateados = backendProductos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre.toUpperCase(),
        existencias: producto.stock_total,
        categoria: producto.categoria_nombre || 'General',
        cantidad: 0,
        precio: producto.precio
      }));
      
      // Actualizar productos locales
      setProductos(productosFormateados);
      localStorage.setItem('productos', JSON.stringify(productosFormateados));
      
      // Intentar cargar movimientos desde el backend
      try {
        const backendMovimientos = await movimientoService.getAll();
        
        // Convertir movimientos del backend al formato local
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
        
        // Obtener movimientos locales actuales
        const movimientosLocalesStr = localStorage.getItem('movimientos');
        const movimientosLocales = movimientosLocalesStr ? JSON.parse(movimientosLocalesStr) : [];
        
        // Crear un mapa de IDs de movimientos del backend para búsqueda rápida
        const backendMovimientosIds = new Set(backendMovimientos.map(m => m.id));
        
        // Filtrar movimientos locales que no están en el backend
        const movimientosLocalesUnicos = movimientosLocales.filter(
          m => !backendMovimientosIds.has(m.id) && m.id.toString().includes('-')
        );
        
        // Combinar movimientos del backend y locales únicos
        const movimientosCombinados = [...movimientosFormateados, ...movimientosLocalesUnicos];
        
        // Actualizar movimientos locales
        setMovimientos(movimientosCombinados);
        localStorage.setItem('movimientos', JSON.stringify(movimientosCombinados));
      } catch (error) {
        console.error('Error al cargar movimientos desde el backend:', error);
        
        // Si falla la carga desde el backend, mantener los movimientos locales
        const movimientosLocalesStr = localStorage.getItem('movimientos');
        if (movimientosLocalesStr) {
          const movimientosLocales = JSON.parse(movimientosLocalesStr);
          setMovimientos(movimientosLocales);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al sincronizar con backend:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Valor del contexto
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