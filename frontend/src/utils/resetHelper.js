// src/utils/resetHelper.js

/**
 * Función para resetear completamente las cantidades en localStorage
 */
export const resetearCantidadesCompletamente = () => {
  try {
    // 1. Obtener productos del localStorage
    const productosStr = localStorage.getItem('productos');
    if (!productosStr) return false;
    
    const productos = JSON.parse(productosStr);
    
    // 2. Resetear todas las cantidades a 0
    const productosReseteados = productos.map(producto => ({
      ...producto,
      cantidad: 0
    }));
    
    // 3. Guardar de vuelta en localStorage
    localStorage.setItem('productos', JSON.stringify(productosReseteados));
    
    // 4. Limpiar también productosRegistrados
    const fechaActual = new Date().toLocaleDateString('es-ES');
    const productosRegistradosStr = localStorage.getItem('productosRegistrados');
    
    if (productosRegistradosStr) {
      const productosRegistrados = JSON.parse(productosRegistradosStr);
      
      // Si hay registros para la fecha actual, resetear las cantidades
      if (productosRegistrados[fechaActual]) {
        productosRegistrados[fechaActual] = productosRegistrados[fechaActual].map(p => ({
          ...p,
          cantidad: 0
        }));
        
        localStorage.setItem('productosRegistrados', JSON.stringify(productosRegistrados));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error al resetear cantidades:', error);
    return false;
  }
};