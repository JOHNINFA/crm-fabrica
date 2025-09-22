// src/services/productIntegration.js

/**
 * Servicio para integrar productos entre el sistema POS y el sistema de Inventario
 */

// Función para convertir un producto del formato POS al formato de Inventario
export const convertPosProductToInventory = (posProduct) => {
  return {
    id: posProduct.id,
    nombre: posProduct.name.toUpperCase(), // En inventario los nombres están en mayúsculas
    existencias: posProduct.stock || 0,
    categoria: posProduct.category || 'General',
    cantidad: 0, // Cantidad inicial para el formulario de inventario
    precio: posProduct.price || 0
  };
};

// Función para sincronizar productos del POS al inventario
export const syncPosProductsToInventory = () => {
  try {
    // Obtener productos del POS desde localStorage
    const posProductsStr = localStorage.getItem('products');
    if (!posProductsStr) return [];
    
    const posProducts = JSON.parse(posProductsStr);
    
    // Obtener productos de inventario desde localStorage
    const inventoryProductsStr = localStorage.getItem('productos');
    const inventoryProducts = inventoryProductsStr ? JSON.parse(inventoryProductsStr) : [];
    
    // Convertir productos del POS al formato de inventario
    const convertedPosProducts = posProducts.map(convertPosProductToInventory);
    
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
    
    return combinedProducts;
  } catch (error) {
    console.error('Error al sincronizar productos:', error);
    return [];
  }
};

// Función para sincronizar un solo producto del POS al inventario
export const syncSinglePosProductToInventory = (posProduct) => {
  try {
    // Obtener productos de inventario desde localStorage
    const inventoryProductsStr = localStorage.getItem('productos');
    const inventoryProducts = inventoryProductsStr ? JSON.parse(inventoryProductsStr) : [];
    
    // Convertir el producto del POS al formato de inventario
    const inventoryProduct = convertPosProductToInventory(posProduct);
    
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
    
    return inventoryProducts;
  } catch (error) {
    console.error('Error al sincronizar producto individual:', error);
    return null;
  }
};