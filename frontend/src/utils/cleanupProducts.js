// src/utils/cleanupProducts.js

/**
 * Elimina productos específicos del inventario
 */
export const eliminarProductosEspecificos = () => {
  try {
    // IDs de productos a eliminar
    const idsAEliminar = [2, 12, 14, 15, 16, 37, 39];
    
    // Eliminar de localStorage 'productos'
    const productosStr = localStorage.getItem('productos');
    if (productosStr) {
      const productos = JSON.parse(productosStr);
      const productosFiltrados = productos.filter(p => !idsAEliminar.includes(p.id));
      localStorage.setItem('productos', JSON.stringify(productosFiltrados));
    }
    
    // Disparar evento para actualizar la UI
    const event = new Event('productosUpdated');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar productos específicos:', error);
    return false;
  }
};

/**
 * Limpia completamente el localStorage y recarga la página
 */
export const limpiarLocalStorage = () => {
  try {
    localStorage.clear();
    window.location.reload();
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
};