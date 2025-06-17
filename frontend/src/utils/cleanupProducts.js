/**
 * Script para eliminar productos sin imagen
 * 
 * Para usar este script:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega todo el contenido de este archivo
 * 3. Presiona Enter para ejecutar
 */

// Función para eliminar productos sin imagen
const removeProductsWithoutImage = () => {
  try {
    // Obtener productos de localStorage
    const productsStr = localStorage.getItem('products');
    if (!productsStr) {
      console.log('No hay productos en localStorage');
      return;
    }
    
    const products = JSON.parse(productsStr);
    console.log(`Total de productos antes: ${products.length}`);
    
    // Filtrar productos sin imagen
    const productsWithImage = products.filter(product => 
      product.image && typeof product.image === 'string' && 
      (product.image.startsWith('data:') || product.image.startsWith('/'))
    );
    
    console.log(`Productos con imagen: ${productsWithImage.length}`);
    console.log(`Productos sin imagen a eliminar: ${products.length - productsWithImage.length}`);
    
    // Guardar productos filtrados en localStorage
    localStorage.setItem('products', JSON.stringify(productsWithImage));
    
    // Notificar a la aplicación que los productos han cambiado
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('productosUpdated'));
    
    console.log('Productos sin imagen eliminados correctamente');
    console.log('Recarga la página para ver los cambios');
    
    return productsWithImage;
  } catch (error) {
    console.error('Error al eliminar productos sin imagen:', error);
    return null;
  }
};

// Ejecutar la función
removeProductsWithoutImage();