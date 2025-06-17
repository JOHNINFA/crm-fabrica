// src/utils/cleanupCantidades.js

/**
 * Función para limpiar completamente las cantidades de los productos específicos
 */
export const limpiarCantidadesProductosEspecificos = () => {
  try {
    // IDs de los productos específicos
    const idsProductos = [
      // Aquí los IDs de los productos que mencionaste
      // Puedes agregar más IDs según sea necesario
    ];
    
    // Buscar estos productos en localStorage
    const productosStr = localStorage.getItem('productos');
    if (!productosStr) return false;
    
    const productos = JSON.parse(productosStr);
    
    // Buscar estos productos en localStorage 'products' (POS)
    const posProductsStr = localStorage.getItem('products');
    if (!posProductsStr) return false;
    
    const posProducts = JSON.parse(posProductsStr);
    
    // Buscar los productos por nombre
    const nombresProductos = [
      'AREPA TIPO OBLEA 500GR',
      'AREPA MEDIANA 330GR'
    ];
    
    // Encontrar los IDs de estos productos
    const productosEncontrados = posProducts.filter(p => 
      nombresProductos.some(nombre => 
        p.name && p.name.toUpperCase().includes(nombre)
      )
    );
    
    // Si encontramos los productos, resetear sus cantidades
    if (productosEncontrados.length > 0) {
      const idsEncontrados = productosEncontrados.map(p => p.id);
      
      // Actualizar productos en localStorage
      const productosActualizados = productos.map(p => {
        if (idsEncontrados.includes(p.id)) {
          return {
            ...p,
            cantidad: 0
          };
        }
        return p;
      });
      
      localStorage.setItem('productos', JSON.stringify(productosActualizados));
      
      // También limpiar en productosRegistrados
      const productosRegistradosStr = localStorage.getItem('productosRegistrados');
      if (productosRegistradosStr) {
        const productosRegistrados = JSON.parse(productosRegistradosStr);
        
        // Recorrer todas las fechas
        Object.keys(productosRegistrados).forEach(fecha => {
          productosRegistrados[fecha] = productosRegistrados[fecha].map(p => {
            if (idsEncontrados.includes(p.id)) {
              return {
                ...p,
                cantidad: 0
              };
            }
            return p;
          });
        });
        
        localStorage.setItem('productosRegistrados', JSON.stringify(productosRegistrados));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error al limpiar cantidades:', error);
    return false;
  }
};