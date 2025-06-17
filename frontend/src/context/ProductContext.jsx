/**
 * ProductContext.jsx
 * 
 * Este contexto maneja el estado global de los productos en el sistema POS.
 * Proporciona funciones para gestionar productos, categorías y el carrito de compras.
 * 
 * Características principales:
 * - Persistencia de productos y categorías en localStorage
 * - Sincronización con el sistema de inventario y el backend
 * - Gestión de productos (agregar, actualizar, eliminar)
 * - Gestión de categorías
 * - Funciones para el carrito de compras
 */

import React, { createContext, useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '../services/syncService';
import { localImageService } from '../services/localImageService';
import { fileSystemImageService } from '../services/fileSystemImageService';
import { productoService, categoriaService } from '../services/api';

// Crear el contexto
const ProductContext = createContext();

// Hook personalizado para usar el contexto
export const useProducts = () => useContext(ProductContext);

/**
 * SECCIÓN 1: PROVEEDOR DEL CONTEXTO
 * 
 * Este componente proporciona el contexto de productos a toda la aplicación.
 * Inicializa los estados desde localStorage y define las funciones para
 * manipular productos y categorías.
 */
export const ProductProvider = ({ children }) => {
  /**
   * SECCIÓN 1.1: ESTADOS INICIALES
   * 
   * Estos estados se cargan desde el backend, con localStorage como respaldo.
   */
  
  // Estados para productos y categorías
  const [products, setProducts] = useState([
    { id: 2, name: "Servicio", price: 0, category: "Servicios", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" },
  ]);
  const [categories, setCategories] = useState(["Servicios"]);
  
  // Estado para controlar si estamos sincronizando con el backend
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Efecto para cargar datos desde localStorage (prioridad) y backend (solo si no hay datos locales)
  useEffect(() => {
    const loadData = async () => {
      setIsSyncing(true);
      setIsLoading(true);
      
      try {
        // Cargar productos desde localStorage (prioridad)
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          setProducts(parsedProducts);
          console.log("Productos cargados desde localStorage:", parsedProducts.length);
          
          // Cargar lista de productos eliminados
          const deletedIdsStr = localStorage.getItem('deletedProductIds');
          const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
          
          // Si hay productos en localStorage, no cargar desde backend
          // Solo intentar cargar desde backend si no hay productos en localStorage
        } else {
          console.log("No hay productos en localStorage, intentando cargar desde backend");
          
          // Intentar cargar productos desde el backend
          try {
            const backendProducts = await productoService.getAll();
            
            if (backendProducts && backendProducts.length > 0 && !backendProducts.error) {
              // Convertir productos del backend al formato local
              const formattedProducts = backendProducts.map(product => ({
                id: product.id,
                name: product.nombre,
                price: parseFloat(product.precio) || 0,
                purchasePrice: parseFloat(product.precio_compra) || 0,
                stock: product.stock_total || 0,
                category: product.categoria_nombre || 'General',
                brand: product.marca || 'GENERICA',
                tax: product.impuesto || 'IVA(0%)',
                image: product.imagen ? `${product.imagen}?${Date.now()}` : null
              }));
              
              console.log("Productos cargados desde backend:", formattedProducts.length);
              
              // Solo actualizar si hay productos en el backend y no hay productos en localStorage
              if (formattedProducts.length > 0) {
                setProducts(formattedProducts);
                
                // Guardar en localStorage como respaldo
                localStorage.setItem('products', JSON.stringify(formattedProducts));
              }
            }
          } catch (backendError) {
            console.log('Error al cargar datos desde el backend:', backendError);
          }
        }
        
        // Cargar categorías desde localStorage
        const savedCategories = localStorage.getItem('categories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        } else {
          // Solo intentar cargar categorías desde backend si no hay en localStorage
          try {
            const backendCategories = await categoriaService.getAll();
            if (backendCategories && backendCategories.length > 0 && !backendCategories.error) {
              const categoryNames = backendCategories.map(cat => cat.nombre);
              setCategories(categoryNames);
              localStorage.setItem('categories', JSON.stringify(categoryNames));
            }
          } catch (catError) {
            console.log('Error al cargar categorías desde el backend:', catError);
          }
        }
      } catch (error) {
        console.log('Error al cargar datos:', error);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };
    
    // Cargar datos al iniciar
    loadData();
    
    // Desactivar sincronización periódica en segundo plano para evitar problemas
    // const syncInterval = setInterval(() => {
    //   syncService.syncAllToBackend();
    // }, 60000); // Sincronizar cada minuto
    
    // Escuchar eventos de storage para mantener sincronizado entre pestañas
    const handleStorageChange = (e) => {
      if (e.key === 'products') {
        try {
          const newProducts = JSON.parse(e.newValue);
          if (newProducts && Array.isArray(newProducts)) {
            setProducts(newProducts);
          }
        } catch (error) {
          console.error('Error al procesar cambios en localStorage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      // clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  /**
   * SECCIÓN 1.2: FUNCIONES DE GESTIÓN DE PRODUCTOS
   * 
   * Estas funciones permiten actualizar, agregar y eliminar productos,
   * manteniendo la sincronización con localStorage.
   */
  
  // Guarda productos localmente sin intentar sincronizar con el backend
  const saveProductsLocally = (newProducts) => {
    try {
      console.log("Guardando productos localmente:", newProducts.length);
      
      // Actualizar el estado de productos
      setProducts(newProducts);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem('products', JSON.stringify(newProducts));
      
      // Forzar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      // Extraer categorías únicas de los productos y actualizarlas
      const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
        localStorage.setItem('categories', JSON.stringify(uniqueCategories));
      }
      
      return true;
    } catch (error) {
      console.error("Error al guardar productos localmente:", error);
      return false;
    }
  };

  // Actualiza todos los productos a la vez (útil para sincronización con API)
  const updateProducts = async (newProducts) => {
    try {
      console.log("Guardando productos:", newProducts.length);
      
      // Primero guardar localmente para asegurar que los cambios persistan
      saveProductsLocally(newProducts);
      
      // Intentar sincronizar con el backend (pero no depender de ello)
      try {
        // Extraer categorías únicas de los productos y actualizarlas
        const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
        if (uniqueCategories.length > 0) {
          // Sincronizar categorías con el backend
          uniqueCategories.forEach(categoryName => {
            syncService.queueOperation('CATEGORY_CREATE', { nombre: categoryName });
          });
        }
        
        // Sincronizar productos con el backend
        newProducts.forEach(product => {
          if (product.id) {
            // Producto existente, actualizarlo
            syncService.queueOperation('PRODUCT_UPDATE', {
              id: product.id,
              nombre: product.name,
              precio: product.price,
              precio_compra: product.purchasePrice || 0,
              stock_total: product.stock || 0,
              categoria: product.category,
              marca: product.brand || 'GENERICA',
              impuesto: product.tax || 'IVA(0%)',
              activo: true
            });
          } else {
            // Nuevo producto, crearlo
            syncService.queueOperation('PRODUCT_CREATE', {
              nombre: product.name,
              precio: product.price,
              precio_compra: product.purchasePrice || 0,
              stock_total: product.stock || 0,
              categoria: product.category,
              marca: product.brand || 'GENERICA',
              impuesto: product.tax || 'IVA(0%)',
              activo: true
            });
          }
        });
        
        // Procesar la cola de sincronización inmediatamente
        syncService.processSyncQueue().catch(e => console.warn("Error en sincronización, continuando con operación local:", e));
      } catch (syncError) {
        console.warn("Error al intentar sincronizar con backend:", syncError);
        // Continuar con la operación local aunque falle la sincronización
      }
      
      return true;
    } catch (error) {
      console.error("Error al guardar productos:", error);
      return false;
    }
  };

  /**
   * SECCIÓN 1.3: FUNCIONES DE GESTIÓN DE CATEGORÍAS
   * 
   * Estas funciones permiten agregar y eliminar categorías,
   * manteniendo la integridad de los productos asociados.
   */
  
  // Agrega una nueva categoría si no existe
  const addCategory = async (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      try {
        // Intentar crear la categoría en el backend
        await categoriaService.create(newCategory);
        
        // Actualizar el estado local
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        return true;
      } catch (error) {
        console.error('Error al crear categoría en el backend:', error);
        
        // Si falla, guardar solo localmente y encolar para sincronización
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        // Encolar para sincronización posterior
        syncService.queueOperation('CATEGORY_CREATE', { nombre: newCategory });
        
        return true;
      }
    }
    return false;
  };
  
  // Elimina una categoría y reasigna sus productos
  const removeCategory = (categoryToRemove) => {
    // No permitir eliminar si solo queda una categoría (siempre debe haber al menos una)
    if (categories.length <= 1) {
      return false;
    }
    
    // Determinar a qué categoría mover los productos (la primera disponible que no sea la que se elimina)
    const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || "Sin categoría";
    
    // Actualizar productos de la categoría eliminada a la categoría de respaldo
    const updatedProducts = products.map(product => 
      product.category === categoryToRemove 
        ? { ...product, category: fallbackCategory } 
        : product
    );
    
    // Actualizar productos en estado y localStorage
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    // Eliminar la categoría del listado
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    return true;
  };

  // Función para actualizar el stock de un producto
  const updateStock = async (productId, newStock, usuario = 'Sistema', nota = '') => {
    // Buscar el producto
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    // Calcular la diferencia para el movimiento
    const diferencia = newStock - (product.stock || 0);
    if (diferencia === 0) return true; // No hay cambio
    
    try {
      // Actualizar el stock en el backend
      await productoService.updateStock(productId, diferencia, usuario, nota);
      
      // Actualizar el stock en el estado local
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      // Actualizar estado y localStorage
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      return true;
    } catch (error) {
      console.error('Error al actualizar stock en el backend:', error);
      
      // Si falla, actualizar solo localmente y encolar para sincronización
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      // Actualizar estado y localStorage
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Encolar para sincronización posterior
      syncService.queueOperation('PRODUCT_UPDATE_STOCK', {
        id: productId,
        stock: diferencia, // Enviamos la diferencia, no el nuevo total
        usuario,
        nota
      });
      
      return true;
    }
  };

  // Función para agregar un nuevo producto
  const addProduct = async (productData) => {
    let updatedProduct;
    
    // Si el producto ya existe (tiene id), actualizarlo
    if (productData.id) {
      try {
        // Preparar datos para el backend
        const backendData = {
          id: productData.id,
          nombre: productData.nombre || productData.name,
          precio: productData.precioVenta || productData.price || 0,
          precio_compra: productData.precioCompra || productData.purchasePrice || 0,
          stock_total: productData.existencias || productData.stock || 0,
          categoria: productData.categoria || productData.category,
          marca: productData.marca || productData.brand || 'GENERICA',
          impuesto: productData.impuesto || productData.tax || 'IVA(0%)',
          activo: true
        };
        
        // Actualizar en el backend
        const updatedBackendProduct = await productoService.update(productData.id, backendData);
        
        // Actualizar en el estado local
        const updatedProducts = products.map(product => 
          product.id === productData.id 
            ? {
                ...product,
                name: productData.nombre || productData.name,
                price: productData.precioVenta || productData.price || 0,
                category: productData.categoria || productData.category,
                image: productData.imagen || productData.image,
                stock: productData.existencias || productData.stock || 0,
                measureType: productData.tipoMedida || productData.measureType,
                tax: productData.impuesto || productData.tax,
                brand: productData.marca || productData.brand,
                accountGroup: productData.grupoContable || productData.accountGroup,
                purchasePrice: productData.precioCompra || productData.purchasePrice || 0,
              }
            : product
        );
        
        setProducts(updatedProducts);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = updatedProducts.find(p => p.id === productData.id);
        
        // Si hay imagen, guardarla en el sistema de archivos
        if (updatedProduct.image && typeof updatedProduct.image === 'string' && updatedProduct.image.startsWith('data:')) {
          try {
            // Guardar imagen en el sistema de archivos a través del backend
            const imageUrl = await fileSystemImageService.saveImageToFileSystem(
              updatedProduct.image, 
              updatedProduct.id, 
              updatedProduct.name
            );
            
            if (imageUrl) {
              console.log(`Imagen guardada en sistema de archivos para producto ${updatedProduct.name}`);
              
              // Actualizar la URL de la imagen en el estado local
              const updatedProductsWithImage = products.map(p => 
                p.id === updatedProduct.id ? { ...p, image: imageUrl } : p
              );
              setProducts(updatedProductsWithImage);
              
              // Guardar en localStorage como respaldo
              localStorage.setItem('products', JSON.stringify(updatedProductsWithImage));
            }
          } catch (error) {
            console.error('Error al guardar imagen:', error);
          }
        }
      } catch (error) {
        console.error('Error al actualizar producto en el backend:', error);
        
        // Si falla, actualizar solo localmente y encolar para sincronización
        const updatedProducts = products.map(product => 
          product.id === productData.id 
            ? {
                ...product,
                name: productData.nombre || productData.name,
                price: productData.precioVenta || productData.price || 0,
                category: productData.categoria || productData.category,
                image: productData.imagen || productData.image,
                stock: productData.existencias || productData.stock || 0,
                measureType: productData.tipoMedida || productData.measureType,
                tax: productData.impuesto || productData.tax,
                brand: productData.marca || productData.brand,
                accountGroup: productData.grupoContable || productData.accountGroup,
                purchasePrice: productData.precioCompra || productData.purchasePrice || 0,
              }
            : product
        );
        
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = updatedProducts.find(p => p.id === productData.id);
        
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_UPDATE', {
          id: updatedProduct.id,
          nombre: updatedProduct.name,
          precio: updatedProduct.price,
          precio_compra: updatedProduct.purchasePrice || 0,
          stock_total: updatedProduct.stock || 0,
          categoria: updatedProduct.category,
          marca: updatedProduct.brand || 'GENERICA',
          impuesto: updatedProduct.tax || 'IVA(0%)',
          activo: true
        });
        
        // Si hay imagen, guardarla localmente
        if (updatedProduct.image && typeof updatedProduct.image === 'string' && updatedProduct.image.startsWith('data:')) {
          try {
            fileSystemImageService.saveImageToFileSystem(updatedProduct.image, updatedProduct.id, updatedProduct.name);
            localImageService.saveImage(updatedProduct.id, updatedProduct.image);
          } catch (imageError) {
            console.error('Error al guardar imagen localmente:', imageError);
          }
        }
      }
    } else {
      // Si es un producto nuevo, crearlo
      try {
        // Preparar datos para el backend
        const backendData = {
          nombre: productData.nombre,
          precio: productData.precioVenta || productData.precioCompra || 0,
          precio_compra: productData.precioCompra || 0,
          stock_total: productData.existencias || 0,
          categoria: productData.categoria,
          marca: productData.marca || 'GENERICA',
          impuesto: productData.impuesto || 'IVA(0%)',
          activo: true
        };
        
        // Crear en el backend
        const createdBackendProduct = await productoService.create(backendData);
        
        // Crear en el estado local con el ID del backend
        const newProduct = {
          id: createdBackendProduct.id,
          name: productData.nombre,
          price: productData.precioVenta || productData.precioCompra || 0,
          category: productData.categoria,
          image: productData.imagen,
          stock: productData.existencias || 0,
          measureType: productData.tipoMedida,
          tax: productData.impuesto,
          brand: productData.marca,
          accountGroup: productData.grupoContable,
          purchasePrice: productData.precioCompra || 0,
        };
        
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = newProduct;
        
        // Si hay imagen, guardarla en el sistema de archivos
        if (newProduct.image && typeof newProduct.image === 'string' && newProduct.image.startsWith('data:')) {
          try {
            // Guardar imagen en el sistema de archivos a través del backend
            const imageUrl = await fileSystemImageService.saveImageToFileSystem(
              newProduct.image, 
              newProduct.id, 
              newProduct.name
            );
            
            if (imageUrl) {
              console.log(`Imagen guardada en sistema de archivos para producto ${newProduct.name}`);
              
              // Actualizar la URL de la imagen en el estado local
              const updatedProductsWithImage = updatedProducts.map(p => 
                p.id === newProduct.id ? { ...p, image: imageUrl } : p
              );
              setProducts(updatedProductsWithImage);
              
              // Guardar en localStorage como respaldo
              localStorage.setItem('products', JSON.stringify(updatedProductsWithImage));
            }
          } catch (error) {
            console.error('Error al guardar imagen:', error);
          }
        }
      } catch (error) {
        console.error('Error al crear producto en el backend:', error);
        
        // Si falla, crear solo localmente y encolar para sincronización
        const newProduct = {
          id: uuidv4(), // Genera un ID único local
          name: productData.nombre,
          price: productData.precioVenta || productData.precioCompra || 0,
          category: productData.categoria,
          image: productData.imagen,
          stock: productData.existencias || 0,
          measureType: productData.tipoMedida,
          tax: productData.impuesto,
          brand: productData.marca,
          accountGroup: productData.grupoContable,
          purchasePrice: productData.precioCompra || 0,
        };
        
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = newProduct;
        
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_CREATE', {
          nombre: newProduct.name,
          precio: newProduct.price,
          precio_compra: newProduct.purchasePrice || 0,
          stock_total: newProduct.stock || 0,
          categoria: newProduct.category,
          marca: newProduct.brand || 'GENERICA',
          impuesto: newProduct.tax || 'IVA(0%)',
          activo: true
        });
        
        // Si hay imagen, guardarla localmente
        if (newProduct.image && typeof newProduct.image === 'string' && newProduct.image.startsWith('data:')) {
          try {
            fileSystemImageService.saveImageToFileSystem(newProduct.image, newProduct.id, newProduct.name);
            localImageService.saveImage(newProduct.id, newProduct.image);
          } catch (imageError) {
            console.error('Error al guardar imagen localmente:', imageError);
          }
        }
      }
    }
    
    // Sincronizar con el inventario manualmente
    try {
      // Convertir el producto al formato de inventario
      const inventoryProduct = {
        id: updatedProduct.id,
        nombre: updatedProduct.name.toUpperCase(),
        existencias: updatedProduct.stock || 0,
        categoria: updatedProduct.category || 'General',
        cantidad: 0,
        precio: updatedProduct.price || 0
      };
      
      // Obtener productos de inventario desde localStorage
      const inventoryProductsStr = localStorage.getItem('productos');
      const inventoryProducts = inventoryProductsStr ? JSON.parse(inventoryProductsStr) : [];
      
      // Buscar si el producto ya existe en el inventario
      const existingIndex = inventoryProducts.findIndex(p => p.id === inventoryProduct.id);
      
      if (existingIndex >= 0) {
        // Actualizar producto existente
        inventoryProducts[existingIndex] = {
          ...inventoryProducts[existingIndex],
          nombre: inventoryProduct.nombre,
          existencias: inventoryProduct.existencias,
          categoria: inventoryProduct.categoria,
          precio: inventoryProduct.precio
        };
      } else {
        // Agregar nuevo producto
        inventoryProducts.push(inventoryProduct);
      }
      
      // Guardar productos actualizados en localStorage
      localStorage.setItem('productos', JSON.stringify(inventoryProducts));
    } catch (error) {
      console.error('Error al sincronizar producto con inventario:', error);
    }
    
    return updatedProduct;
  };

  // Función para agregar un producto al carrito
  const addToCart = async (productId) => {
    try {
      // Buscar el producto en el estado local
      const product = products.find(p => p.id === productId);
      
      if (product) {
        // Verificar stock antes de agregar al carrito
        if (product.stock <= 0) {
          console.warn(`No hay stock disponible para ${product.name}`);
          return false;
        }
        
        // Actualizar stock localmente
        const updatedProducts = products.map(p => 
          p.id === productId 
            ? { ...p, stock: Math.max(0, p.stock - 1) } 
            : p
        );
        
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        // Encolar sincronización del cambio de stock con el backend
        const updatedProduct = updatedProducts.find(p => p.id === productId);
        if (updatedProduct) {
          syncService.queueOperation('PRODUCT_UPDATE_STOCK', {
            id: productId,
            stock: updatedProduct.stock,
            usuario: 'Usuario POS',
            nota: 'Venta desde POS'
          });
          
          // Registrar movimiento de salida
          syncService.queueOperation('MOVEMENT_CREATE', {
            producto: productId,
            tipo: 'SALIDA',
            cantidad: 1,
            usuario: 'Usuario POS',
            nota: 'Venta desde POS'
          });
        }
        
        console.log(`Producto ${productId} agregado al carrito y stock actualizado`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al agregar producto al carrito:', error);
      return false;
    }
  };

  // Función para eliminar un producto localmente sin depender del backend
  const deleteProductLocally = (productId) => {
    try {
      console.log("Eliminando producto localmente:", productId);
      
      // Eliminar del estado local
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Forzar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      // Eliminar también del inventario
      try {
        const inventoryProductsStr = localStorage.getItem('productos');
        if (inventoryProductsStr) {
          const inventoryProducts = JSON.parse(inventoryProductsStr);
          const updatedInventoryProducts = inventoryProducts.filter(product => product.id !== productId);
          localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
        }
      } catch (error) {
        console.error('Error al eliminar producto del inventario:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto localmente:', error);
      return false;
    }
  };

  // Función para eliminar un producto
  const deleteProduct = async (productId) => {
    try {
      console.log("Eliminando producto:", productId);
      
      // Primero eliminar localmente para asegurar que los cambios persistan
      deleteProductLocally(productId);
      
      // Intentar marcar como inactivo en el backend
      try {
        await productoService.update(productId, { activo: false });
      } catch (apiError) {
        console.warn('Error al marcar producto como inactivo en el backend:', apiError);
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_UPDATE', {
          id: productId,
          activo: false
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      
      // Asegurarse de que el producto se elimine localmente aunque falle todo lo demás
      deleteProductLocally(productId);
      
      return true;
    }
  };

  // Función para sincronizar manualmente con el backend
  const syncWithBackend = async () => {
    setIsSyncing(true);
    try {
      // Primero sincronizar hacia el backend
      await syncService.syncAllToBackend();
      // Luego sincronizar desde el backend
      await syncService.syncFromBackend();
      return true;
    } catch (error) {
      console.error('Error al sincronizar con el backend:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      categories, 
      addProduct, 
      addCategory, 
      removeCategory, 
      addToCart, 
      updateProducts,
      deleteProduct,
      updateStock,
      syncWithBackend,
      isSyncing
    }}>
      {children}
    </ProductContext.Provider>
  );
};