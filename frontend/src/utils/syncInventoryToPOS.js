/**
 * Utilidad para sincronizar existencias del inventario al POS
 * 
 * Esta función se encarga de mantener sincronizadas las existencias
 * entre el módulo de inventario y el módulo POS.
 */

/**
 * Sincroniza las existencias del inventario con el POS
 * @param {Array} inventoryProducts - Productos del inventario con existencias actualizadas
 * @returns {boolean} - True si la sincronización fue exitosa
 */
export const syncInventoryToPOS = (inventoryProducts) => {
  try {

    
    // Obtener productos del POS desde localStorage
    const posProductsStr = localStorage.getItem('products');
    if (!posProductsStr) {
      console.warn('No se encontraron productos en el POS para sincronizar');
      return false;
    }
    
    const posProducts = JSON.parse(posProductsStr);
    let hasChanges = false;
    
    // Actualizar existencias en productos del POS
    const updatedPosProducts = posProducts.map(posProduct => {
      // Buscar el producto correspondiente en el inventario
      const inventoryProduct = inventoryProducts.find(invProduct => invProduct.id === posProduct.id);
      
      if (inventoryProduct) {
        // Verificar si hay cambios en las existencias
        if (posProduct.stock !== inventoryProduct.existencias) {
          console.log(`Sincronizando: ${posProduct.name} - Stock POS: ${posProduct.stock} -> Stock Inventario: ${inventoryProduct.existencias}`);
          hasChanges = true;
          
          return {
            ...posProduct,
            stock: inventoryProduct.existencias
          };
        }
      }
      
      return posProduct;
    });
    
    // Solo actualizar si hay cambios
    if (hasChanges) {
      // Guardar productos actualizados en localStorage del POS
      localStorage.setItem('products', JSON.stringify(updatedPosProducts));
      
      // Disparar eventos para notificar a otros componentes
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      

      return true;
    } else {

      return true;
    }
    
  } catch (error) {
    console.error('Error al sincronizar inventario con POS:', error);
    return false;
  }
};

/**
 * Sincroniza las existencias del POS con el inventario
 * @param {Array} posProducts - Productos del POS con existencias actualizadas
 * @returns {boolean} - True si la sincronización fue exitosa
 */
export const syncPOSToInventory = (posProducts) => {
  try {

    
    // Obtener productos del inventario desde localStorage
    const inventoryProductsStr = localStorage.getItem('productos');
    if (!inventoryProductsStr) {
      console.warn('No se encontraron productos en el inventario para sincronizar');
      return false;
    }
    
    const inventoryProducts = JSON.parse(inventoryProductsStr);
    let hasChanges = false;
    
    // Actualizar existencias en productos del inventario
    const updatedInventoryProducts = inventoryProducts.map(inventoryProduct => {
      // Buscar el producto correspondiente en el POS
      const posProduct = posProducts.find(posP => posP.id === inventoryProduct.id);
      
      if (posProduct) {
        // Verificar si hay cambios en las existencias
        if (inventoryProduct.existencias !== posProduct.stock) {
          console.log(`Sincronizando: ${inventoryProduct.nombre} - Stock Inventario: ${inventoryProduct.existencias} -> Stock POS: ${posProduct.stock}`);
          hasChanges = true;
          
          return {
            ...inventoryProduct,
            existencias: posProduct.stock
          };
        }
      }
      
      return inventoryProduct;
    });
    
    // Solo actualizar si hay cambios
    if (hasChanges) {
      // Guardar productos actualizados en localStorage del inventario
      localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
      
      // Disparar eventos para notificar a otros componentes
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      

      return true;
    } else {

      return true;
    }
    
  } catch (error) {
    console.error('Error al sincronizar POS con inventario:', error);
    return false;
  }
};

/**
 * Verifica si un producto existe en ambos módulos y tiene el mismo nombre
 * @param {number} productId - ID del producto a verificar
 * @returns {Object} - Información sobre la sincronización del producto
 */
export const checkProductSync = (productId) => {
  try {
    const posProductsStr = localStorage.getItem('products');
    const inventoryProductsStr = localStorage.getItem('productos');
    
    if (!posProductsStr || !inventoryProductsStr) {
      return { synced: false, reason: 'Datos no disponibles' };
    }
    
    const posProducts = JSON.parse(posProductsStr);
    const inventoryProducts = JSON.parse(inventoryProductsStr);
    
    const posProduct = posProducts.find(p => p.id === productId);
    const inventoryProduct = inventoryProducts.find(p => p.id === productId);
    
    if (!posProduct || !inventoryProduct) {
      return { synced: false, reason: 'Producto no encontrado en uno de los módulos' };
    }
    
    const stockMatch = posProduct.stock === inventoryProduct.existencias;
    const nameMatch = posProduct.name.toUpperCase() === inventoryProduct.nombre.toUpperCase();
    
    return {
      synced: stockMatch && nameMatch,
      posStock: posProduct.stock,
      inventoryStock: inventoryProduct.existencias,
      posName: posProduct.name,
      inventoryName: inventoryProduct.nombre,
      stockMatch,
      nameMatch
    };
    
  } catch (error) {
    console.error('Error al verificar sincronización del producto:', error);
    return { synced: false, reason: 'Error al verificar' };
  }
};