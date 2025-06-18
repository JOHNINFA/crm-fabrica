/**
 * Script para eliminar productos específicos de arepas
 * 
 * Este script debe ejecutarse directamente en la consola del navegador
 * para eliminar los productos específicos de arepas.
 */

// Función autoejecutable para eliminar productos
(async function() {
  try {
    // Importar el servicio de productos
    const productoService = await import('../services/api').then(module => module.productoService);
    
    // Productos a eliminar
    const productsToDelete = [
      { name: 'AREPA TIPO OBLEA', category: 'Arepas' },
      { name: 'AREPA TIPO PINCHO', category: 'Arepas' },
      { name: 'AREPA MEDIANA', category: 'Arepas' }
    ];
    
    console.log('Buscando productos para eliminar...');
    
    // Obtener todos los productos
    const allProducts = await productoService.getAll();
    
    if (!allProducts || allProducts.error) {
      console.error('Error al obtener productos:', allProducts?.error || 'No se pudieron cargar los productos');
      return;
    }
    
    console.log(`Se encontraron ${allProducts.length} productos en total`);
    
    // Encontrar los productos a eliminar
    const productsToRemove = allProducts.filter(product => 
      productsToDelete.some(p => 
        product.nombre === p.name && product.categoria_nombre === p.category
      )
    );
    
    console.log(`Se encontraron ${productsToRemove.length} productos para eliminar:`);
    productsToRemove.forEach(p => console.log(`- ${p.nombre} (ID: ${p.id})`));
    
    // Eliminar cada producto
    for (const product of productsToRemove) {
      console.log(`Eliminando producto: ${product.nombre} (ID: ${product.id})...`);
      
      try {
        // Marcar como inactivo en lugar de eliminar físicamente
        await productoService.update(product.id, { activo: false });
        console.log(`✓ Producto ${product.nombre} marcado como inactivo`);
      } catch (error) {
        console.error(`✗ Error al eliminar producto ${product.nombre}:`, error);
      }
    }
    
    console.log('Proceso completado');
    
    // Actualizar localStorage para mantener sincronizado
    const savedProductsStr = localStorage.getItem('products');
    if (savedProductsStr) {
      const savedProducts = JSON.parse(savedProductsStr);
      
      // Filtrar productos eliminados
      const updatedProducts = savedProducts.filter(product => 
        !productsToDelete.some(p => 
          product.name === p.name && product.category === p.category
        )
      );
      
      // Guardar productos actualizados
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      console.log(`LocalStorage actualizado: ${savedProducts.length} → ${updatedProducts.length} productos`);
      
      // Forzar actualización
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar productos:', error);
    return false;
  }
})();