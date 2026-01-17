import { API_URL } from '../services/api';

/**
 * Consulta la lista de productos al backend
 */
export const consultarTablaProducto = async () => {
  try {

    const response = await fetch(`${API_URL}/productos/`);

    if (!response.ok) {
      throw new Error(`Error al consultar productos: ${response.status}`);
    }

    const productos = await response.json();




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


    console.log(`Productos con stock: ${productosConStock} de ${productos.length}`);
    console.log(`Stock total: ${totalStock} unidades`);

    return productos;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}
