/**
 * Script para desactivar la sincronización automática con el backend
 * Ejecutar en la consola del navegador para evitar que los productos eliminados reaparezcan
 */

// Desactivar sincronización automática
localStorage.setItem('disableSyncWithBackend', 'true');

// Limpiar cola de sincronización
localStorage.removeItem('syncQueue');

// Verificar si hay una lista de productos eliminados, si no, crearla
if (!localStorage.getItem('deletedProductIds')) {
  localStorage.setItem('deletedProductIds', JSON.stringify([]));
}





// Función para aplicar filtro de productos eliminados
const applyDeletedFilter = () => {
  try {
    // Obtener lista de productos eliminados
    const deletedIdsStr = localStorage.getItem('deletedProductIds');
    const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    
    if (deletedIds.length === 0) {

      return;
    }
    
    // Obtener productos actuales
    const productsStr = localStorage.getItem('products');
    if (!productsStr) {

      return;
    }
    
    const products = JSON.parse(productsStr);
    
    // Filtrar productos eliminados
    const filteredProducts = products.filter(p => !deletedIds.includes(p.id));
    
    if (filteredProducts.length === products.length) {

      return;
    }
    
    // Guardar productos filtrados
    localStorage.setItem('products', JSON.stringify(filteredProducts));
    console.log(`Filtrados ${products.length - filteredProducts.length} productos eliminados`);
    
    // Forzar actualización
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('productosUpdated'));
  } catch (error) {
    console.error('Error al aplicar filtro de productos eliminados:', error);
  }
};

// Aplicar filtro inmediatamente
applyDeletedFilter();

// Exportar función para uso futuro
window.applyDeletedFilter = applyDeletedFilter;