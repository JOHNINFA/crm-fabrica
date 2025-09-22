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

console.log('Sincronización automática con el backend desactivada');
console.log('Cola de sincronización limpiada');
console.log('Lista de productos eliminados inicializada');

// Función para aplicar filtro de productos eliminados
const applyDeletedFilter = () => {
  try {
    // Obtener lista de productos eliminados
    const deletedIdsStr = localStorage.getItem('deletedProductIds');
    const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    
    if (deletedIds.length === 0) {
      console.log('No hay productos eliminados para filtrar');
      return;
    }
    
    // Obtener productos actuales
    const productsStr = localStorage.getItem('products');
    if (!productsStr) {
      console.log('No hay productos para filtrar');
      return;
    }
    
    const products = JSON.parse(productsStr);
    
    // Filtrar productos eliminados
    const filteredProducts = products.filter(p => !deletedIds.includes(p.id));
    
    if (filteredProducts.length === products.length) {
      console.log('No se encontraron productos eliminados en la lista actual');
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