// Script para consultar la tabla api_producto
// Ejecutar con: node consulta_productos.js

const fetch = require('node-fetch');

async function consultarProductos() {
  try {
    console.log('Consultando tabla api_producto...');
    const response = await fetch('http://localhost:8000/api/productos/');
    
    if (!response.ok) {
      throw new Error(`Error al consultar productos: ${response.status}`);
    }
    
    const productos = await response.json();
    
    console.log('\n=== TABLA API_PRODUCTO ===\n');
    console.log('Total de productos:', productos.length);
    console.log('\nID | Nombre | Stock | Precio | Categoría\n' + '-'.repeat(50));
    
    productos.forEach(p => {
      console.log(`${p.id} | ${p.nombre} | ${p.stock_total} | $${p.precio} | ${p.categoria_nombre || 'Sin categoría'}`);
    });
    
    // Mostrar estadísticas
    const totalStock = productos.reduce((sum, p) => sum + p.stock_total, 0);
    const productosConStock = productos.filter(p => p.stock_total > 0).length;
    
    console.log('\n=== ESTADÍSTICAS ===');
    console.log(`Productos con stock: ${productosConStock} de ${productos.length}`);
    console.log(`Stock total: ${totalStock} unidades`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

consultarProductos();