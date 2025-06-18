/**
 * Script para eliminar productos específicos de arepas
 * 
 * Este script elimina directamente los productos de arepas de la base de datos.
 * Para ejecutarlo: node eliminar-arepas.js
 */

// Importar axios para hacer peticiones HTTP
const axios = require('axios');

// URL base de la API (ajustar según corresponda)
const API_URL = 'http://localhost:3001/api';

// Productos a eliminar
const productosAEliminar = [
  { nombre: 'AREPA TIPO OBLEA', categoria: 'Arepas' },
  { nombre: 'AREPA TIPO PINCHO', categoria: 'Arepas' },
  { nombre: 'AREPA MEDIANA', categoria: 'Arepas' }
];

// Función para obtener todos los productos
async function obtenerProductos() {
  try {
    const response = await axios.get(`${API_URL}/productos`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    return [];
  }
}

// Función para marcar un producto como inactivo
async function marcarComoInactivo(id) {
  try {
    await axios.put(`${API_URL}/productos/${id}`, { activo: false });
    return true;
  } catch (error) {
    console.error(`Error al marcar producto ${id} como inactivo:`, error.message);
    return false;
  }
}

// Función principal
async function eliminarArepas() {
  console.log('Buscando productos para eliminar...');
  
  // Obtener todos los productos
  const productos = await obtenerProductos();
  
  if (!productos || productos.length === 0) {
    console.log('No se encontraron productos');
    return;
  }
  
  console.log(`Se encontraron ${productos.length} productos en total`);
  
  // Encontrar los productos a eliminar
  const productosParaEliminar = productos.filter(producto => 
    productosAEliminar.some(p => 
      producto.nombre === p.nombre && producto.categoria_nombre === p.categoria
    )
  );
  
  console.log(`Se encontraron ${productosParaEliminar.length} productos para eliminar:`);
  productosParaEliminar.forEach(p => console.log(`- ${p.nombre} (ID: ${p.id})`));
  
  // Eliminar cada producto
  let eliminados = 0;
  for (const producto of productosParaEliminar) {
    console.log(`Eliminando producto: ${producto.nombre} (ID: ${producto.id})...`);
    
    const resultado = await marcarComoInactivo(producto.id);
    if (resultado) {
      console.log(`✓ Producto ${producto.nombre} marcado como inactivo`);
      eliminados++;
    } else {
      console.log(`✗ Error al eliminar producto ${producto.nombre}`);
    }
  }
  
  console.log(`Proceso completado. ${eliminados} de ${productosParaEliminar.length} productos eliminados.`);
}

// Ejecutar la función principal
eliminarArepas().catch(error => {
  console.error('Error al ejecutar el script:', error);
});