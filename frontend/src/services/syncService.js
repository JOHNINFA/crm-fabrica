/**
 * syncService.js
 * 
 * Este servicio maneja la sincronización entre localStorage y el backend.
 * Funciona en segundo plano sin afectar la experiencia del usuario.
 */

import { productoService, categoriaService, loteService, movimientoService } from './api';
import { imageService } from './imageService';

// Cola de operaciones pendientes
let syncQueue = [];
let isSyncing = false;

// Cargar cola de sincronización desde localStorage
const loadSyncQueue = () => {
  try {
    const savedQueue = localStorage.getItem('syncQueue');
    if (savedQueue) {
      syncQueue = JSON.parse(savedQueue);
    }
  } catch (error) {
    console.error('Error al cargar cola de sincronización:', error);
  }
};

// Guardar cola de sincronización en localStorage
const saveSyncQueue = () => {
  try {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  } catch (error) {
    console.error('Error al guardar cola de sincronización:', error);
  }
};

// Inicializar el servicio
const init = () => {
  loadSyncQueue();
  
  // Intentar sincronizar cada 30 segundos
  setInterval(() => {
    processSyncQueue();
  }, 30000);
  
  // Intentar sincronizar inmediatamente
  processSyncQueue();
};

// Procesar cola de sincronización
const processSyncQueue = async () => {
  if (isSyncing || syncQueue.length === 0) return;
  
  isSyncing = true;
  
  try {
    // Eliminar operaciones duplicadas
    const uniqueOperations = [];
    const operationKeys = new Set();
    
    for (const operation of syncQueue) {
      // Ignorar operaciones de movimientos
      if (operation.type === 'MOVEMENT_CREATE') {
        continue;
      }
      
      // Crear una clave única para la operación
      const key = `${operation.type}-${JSON.stringify(operation.data)}`;
      
      // Solo añadir si no existe ya
      if (!operationKeys.has(key)) {
        operationKeys.add(key);
        uniqueOperations.push(operation);
      }
    }
    
    // Procesar cada operación única en la cola
    const currentQueue = uniqueOperations;
    syncQueue = [];
    saveSyncQueue();
    
    console.log(`Procesando ${currentQueue.length} operaciones únicas`);
    
    for (const operation of currentQueue) {
      try {
        await processOperation(operation);
      } catch (error) {
        console.error('Error al procesar operación:', operation, error);
        // Volver a poner en la cola si falló
        syncQueue.push(operation);
        saveSyncQueue();
      }
    }
  } finally {
    isSyncing = false;
  }
};

// Procesar una operación específica
const processOperation = async (operation) => {
  const { type, data } = operation;
  
  // Ignorar operaciones de movimientos
  if (type === 'MOVEMENT_CREATE') {
    return true;
  }
  
  try {
    let result;
    
    switch (type) {
      case 'PRODUCT_CREATE':
        result = await productoService.create(data);
        break;
      case 'PRODUCT_UPDATE':
        result = await productoService.update(data.id, data);
        break;
      case 'PRODUCT_UPDATE_STOCK':
        result = await productoService.updateStock(data.id, data.stock, data.usuario || 'Sistema', data.nota || 'Sincronización automática');
        break;
      case 'CATEGORY_CREATE':
        result = await categoriaService.create(data.nombre);
        break;
      case 'LOT_CREATE':
        result = await loteService.create(data);
        break;
      default:
        console.warn('Tipo de operación desconocido:', type);
        return false;
    }
    
    // Verificar si el resultado indica que la API no está disponible
    if (result && result.error === 'API_UNAVAILABLE') {
      console.warn(`Operación ${type} no procesada: API no disponible`);
      throw new Error('API no disponible'); // Propagar el error para que la operación se vuelva a encolar
    }
    
    return true;
  } catch (error) {
    console.error(`Error al procesar operación ${type}:`, error);
    // Si el error es de conexión o 404, reencolar para intentar más tarde
    if (error.message && (
        error.message.includes('API no disponible') || 
        error.message.includes('404') || 
        error.message.includes('connection'))) {
      throw error; // Propagar el error para que la operación se vuelva a encolar
    }
    // Si es otro tipo de error (como validación), no reencolar
    return false;
  }
};

// Añadir operación a la cola
const queueOperation = (type, data) => {
  // No encolar operaciones de movimientos
  if (type === 'MOVEMENT_CREATE') {
    console.log('Sincronización de movimientos desactivada, no se encola:', type);
    return;
  }
  
  // Verificar si ya existe una operación idéntica en la cola
  const operationKey = `${type}-${JSON.stringify(data)}`;
  const isDuplicate = syncQueue.some(op => 
    `${op.type}-${JSON.stringify(op.data)}` === operationKey
  );
  
  if (isDuplicate) {
    console.log('Operación duplicada, no se encola:', type);
    return;
  }
  
  syncQueue.push({ type, data, timestamp: Date.now() });
  saveSyncQueue();
  
  // Intentar sincronizar inmediatamente si no hay muchas operaciones pendientes
  if (syncQueue.length < 5) {
    processSyncQueue();
  }
};

// Sincronizar productos desde localStorage al backend
const syncProductsToBackend = () => {
  try {
    const productsStr = localStorage.getItem('products');
    if (productsStr) {
      const products = JSON.parse(productsStr);
      
      // Encolar cada producto para sincronización
      products.forEach(product => {
        queueOperation('PRODUCT_UPDATE', {
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
      });
    }
  } catch (error) {
    console.error('Error al sincronizar productos con backend:', error);
  }
};

// Sincronizar categorías desde localStorage al backend
const syncCategoriesToBackend = () => {
  try {
    const categoriesStr = localStorage.getItem('categories');
    if (categoriesStr) {
      const categories = JSON.parse(categoriesStr);
      
      // Encolar cada categoría para sincronización
      categories.forEach(category => {
        queueOperation('CATEGORY_CREATE', { nombre: category });
      });
    }
  } catch (error) {
    console.error('Error al sincronizar categorías con backend:', error);
  }
};

// Sincronizar movimientos desde localStorage al backend
const syncMovementsToBackend = () => {
  // Sincronización de movimientos desactivada
  console.log('Sincronización de movimientos desactivada');
  return;
};

// Sincronizar todo desde localStorage al backend
const syncAllToBackend = async () => {
  try {
    // Verificar si la API está disponible
    const testResponse = await fetch('http://localhost:8000/api/productos/', { 
      method: 'HEAD',
      timeout: 2000
    }).catch(() => null);
    
    if (!testResponse || !testResponse.ok) {
      console.warn('API no disponible, sincronización pospuesta');
      return false;
    }
    
    // Primero sincronizar categorías y productos básicos
    syncCategoriesToBackend();
    syncProductsToBackend();
    // Movimientos desactivados
    // syncMovementsToBackend();
    
    // Luego sincronizar imágenes (esto puede tardar más tiempo)
    try {
      await imageService.syncAllImages();
    } catch (error) {
      console.error('Error al sincronizar imágenes:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Error al sincronizar con el backend:', error);
    return false;
  }
};

// Sincronizar todo desde el backend a localStorage
const syncFromBackend = async () => {
  try {
    // Obtener productos del backend
    const backendProducts = await productoService.getAll();
    
    // Verificar si la API está disponible
    if (backendProducts && backendProducts.error === 'API_UNAVAILABLE') {
      console.warn('API no disponible, usando datos locales');
      return false;
    }
    
    // Si no hay productos en el backend pero sí en localStorage, no sobrescribir
    if (!backendProducts || backendProducts.length === 0) {
      const localProductsStr = localStorage.getItem('products');
      if (localProductsStr && JSON.parse(localProductsStr).length > 0) {
        console.log('No hay productos en el backend, manteniendo datos locales');
        return true;
      }
    }
    
    // Obtener productos actuales de localStorage
    const localProductsStr = localStorage.getItem('products');
    const localProducts = localProductsStr ? JSON.parse(localProductsStr) : [];
    
    // Crear un mapa de productos locales por ID para búsqueda rápida
    const localProductMap = {};
    localProducts.forEach(product => {
      localProductMap[product.id] = product;
    });
    
    // Actualizar productos locales con datos del backend
    const updatedProducts = backendProducts.map(backendProduct => {
      const localProduct = localProductMap[backendProduct.id];
      
      // Si existe localmente, mantener algunos campos locales
      if (localProduct) {
        return {
          ...localProduct,
          stock: backendProduct.stock_total,
          price: backendProduct.precio,
          purchasePrice: backendProduct.precio_compra,
          category: backendProduct.categoria_nombre
        };
      }
      
      // Si no existe localmente, crear nuevo producto
      return {
        id: backendProduct.id,
        name: backendProduct.nombre,
        price: backendProduct.precio,
        purchasePrice: backendProduct.precio_compra,
        stock: backendProduct.stock_total,
        category: backendProduct.categoria_nombre,
        brand: backendProduct.marca,
        tax: backendProduct.impuesto,
        image: backendProduct.imagen
      };
    });
    
    // Mantener productos locales que no existen en el backend
    const backendProductIds = new Set(backendProducts.map(p => p.id));
    const localOnlyProducts = localProducts.filter(p => !backendProductIds.has(p.id));
    
    // Combinar productos del backend y locales
    const combinedProducts = [...updatedProducts, ...localOnlyProducts];
    
    // Guardar productos actualizados en localStorage
    localStorage.setItem('products', JSON.stringify(combinedProducts));
    
    // Disparar evento para notificar a los componentes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('productosUpdated'));
    
    // Sincronizar categorías
    try {
      const backendCategories = await categoriaService.getAll();
      if (backendCategories && backendCategories.length > 0) {
        const categoryNames = backendCategories.map(cat => cat.nombre);
        
        // Obtener categorías locales
        const localCategoriesStr = localStorage.getItem('categories');
        const localCategories = localCategoriesStr ? JSON.parse(localCategoriesStr) : [];
        
        // Combinar categorías sin duplicados
        const combinedCategories = [...new Set([...categoryNames, ...localCategories])];
        localStorage.setItem('categories', JSON.stringify(combinedCategories));
      }
    } catch (error) {
      console.error('Error al sincronizar categorías:', error);
      // No fallar toda la sincronización por un error en categorías
    }
    
    return true;
  } catch (error) {
    console.error('Error al sincronizar desde backend:', error);
    return false;
  }
};

// Limpiar la cola de sincronización
const clearSyncQueue = () => {
  syncQueue = [];
  saveSyncQueue();
  localStorage.removeItem('movimientosSincronizados');
  localStorage.removeItem('movimientos');
  console.log('Cola de sincronización limpiada');
};

export const syncService = {
  init,
  queueOperation,
  syncAllToBackend,
  syncFromBackend,
  processSyncQueue,
  clearSyncQueue
};

// Inicializar el servicio automáticamente
init();