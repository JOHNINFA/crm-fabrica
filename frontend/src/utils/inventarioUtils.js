// src/utils/inventarioUtils.js

/**
 * Sincroniza los productos del inventario con los del POS,
 * reemplazando completamente los productos del inventario con los del POS
 */
export const limpiarInventario = () => {
  try {
    // Obtener productos del POS
    const posProductsStr = localStorage.getItem('products');
    const posProducts = posProductsStr ? JSON.parse(posProductsStr) : [];
    
    // Convertir productos del POS al formato de inventario
    const inventoryProducts = posProducts.map(posProduct => ({
      id: posProduct.id,
      nombre: posProduct.name ? posProduct.name.toUpperCase() : "SIN NOMBRE",
      existencias: posProduct.stock || 0,
      cantidad: 0,
      precio: posProduct.price || 0,
      categoria: posProduct.category || "General",
      imagen: posProduct.image || null
    }));
    
    // Guardar productos actualizados en localStorage
    localStorage.setItem('productos', JSON.stringify(inventoryProducts));
    
    // Disparar evento para actualizar la UI
    const event = new Event('productosUpdated');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error al sincronizar inventario:', error);
    return false;
  }
};

/**
 * Elimina un producto específico del inventario por ID
 */
export const eliminarProductoInventario = (productId) => {
  try {
    // Obtener productos del inventario
    const inventoryProductsStr = localStorage.getItem('productos');
    if (!inventoryProductsStr) return false;
    
    const inventoryProducts = JSON.parse(inventoryProductsStr);
    
    // Filtrar el producto a eliminar
    const updatedInventoryProducts = inventoryProducts.filter(
      product => product.id !== productId
    );
    
    // Guardar productos actualizados en localStorage
    localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
    
    // Disparar evento para actualizar la UI
    const event = new Event('productosUpdated');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar producto del inventario:', error);
    return false;
  }
};