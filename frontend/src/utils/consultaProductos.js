/**
 * Utilidad para consultar la tabla api_producto
 * 
 * Para usar:
 * 1. Importa este archivo en tu aplicación
 * 2. Ejecuta: consultarTablaProducto()
 */

async function consultarTablaProducto() {
  try {
    console.log('Consultando tabla api_producto...');
    const response = await fetch('http://localhost:8000/api/productos/');
    
    if (!response.ok) {
      throw new Error(`Error al consultar productos: ${response.status}`);
    }
    
    const productos = await response.json();
    
    console.log('%c=== TABLA API_PRODUCTO ===', 'font-weight: bold; font-size: 16px; color: blue;');
    console.log('Total de productos:', productos.length);
    
    // Crear tabla para mostrar en consola
    console.table(productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      stock: p.stock_total,
      precio: `$${p.precio}`,
      categoria: p.categoria_nombre || 'Sin categoría',
      marca: p.marca,
      activo: p.activo ? '✅' : '❌'
    })));
    
    // Mostrar estadísticas
    const totalStock = productos.reduce((sum, p) => sum + p.stock_total, 0);
    const productosConStock = productos.filter(p => p.stock_total > 0).length;
    
    console.log('%c=== ESTADÍSTICAS ===', 'font-weight: bold; font-size: 14px; color: green;');
    console.log(`Productos con stock: ${productosConStock} de ${productos.length}`);
    console.log(`Stock total: ${totalStock} unidades`);
    
    return productos;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

// Exportar la función para usarla en otros archivos
export { consultarTablaProducto };