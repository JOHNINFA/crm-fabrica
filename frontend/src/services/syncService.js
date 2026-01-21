/**
 * Servicio de sincronización automática entre la base de datos y el localStorage
 */

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Cola de sincronización
const syncQueue = [];

// Función para sincronizar el localStorage con la base de datos
const sincronizarConBD = async () => {
  try {

    
    // Obtener productos de la BD
    const response = await fetch(`${API_URL}/productos/`);
    if (!response.ok) {

      return false;
    }
    
    const productosFromBD = await response.json();

    
    // Actualizar productos en localStorage (formato inventario)
    let productosParaInventario = productosFromBD.map(p => ({
      id: p.id,
      nombre: p.nombre,
      existencias: p.stock_total,
      categoria: p.categoria_nombre || 'General',
      cantidad: 0,
      orden: p.orden || 0 // ✅ Incluir campo orden de la BD
    }));
    
    // Ordenar productos de inventario por campo 'orden', luego por ID
    productosParaInventario.sort((a, b) => {
      const ordenA = a.orden !== undefined ? a.orden : 999999;
      const ordenB = b.orden !== undefined ? b.orden : 999999;
      
      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }
      
      return (a.id || 0) - (b.id || 0);
    });
    
    localStorage.setItem('productos', JSON.stringify(productosParaInventario));
    
    // Actualizar productos en POS (formato products)
    let productosParaPOS = productosFromBD.map(p => ({
      id: p.id,
      name: p.nombre,
      price: parseFloat(p.precio) || 0,
      stock: p.stock_total || 0,
      category: p.categoria_nombre || 'General',
      brand: p.marca || 'GENERICA',
      tax: p.impuesto || 'IVA(0%)',
      image: p.imagen || null,
      orden: p.orden || 0 // ✅ Incluir campo orden de la BD
    }));
    
    // Ordenar productos del POS por campo 'orden', luego por ID
    productosParaPOS.sort((a, b) => {
      const ordenA = a.orden !== undefined ? a.orden : 999999;
      const ordenB = b.orden !== undefined ? b.orden : 999999;
      
      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }
      
      return (a.id || 0) - (b.id || 0);
    });
    
    localStorage.setItem('products', JSON.stringify(productosParaPOS));
    
    // Notificar cambios
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('productosUpdated'));
    

    return true;
  } catch (error) {

    return false;
  }
};

// Objeto de servicio de sincronización
export const syncService = {
  // Sincronizar desde el backend
  syncFromBackend: sincronizarConBD,
  
  // Sincronizar todo al backend
  syncAllToBackend: async () => {
    try {
      // Obtener productos del localStorage
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Enviar cada producto al backend
      for (const product of products) {
        await fetch(`${API_URL}/productos/${product.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_total: product.stock })
        });
      }
      
      return true;
    } catch (error) {

      return false;
    }
  },
  
  // Agregar a la cola de sincronización
  addToSyncQueue: (item) => {
    syncQueue.push(item);
    return syncQueue.length;
  },
  
  // Procesar cola de sincronización
  processSyncQueue: async () => {
    if (syncQueue.length === 0) {
      return sincronizarConBD();
    }
    
    try {
      while (syncQueue.length > 0) {
        const item = syncQueue.shift();
        // Procesar item...
      }
      
      return sincronizarConBD();
    } catch (error) {

      return false;
    }
  }
};

// Iniciar sincronización automática
(function iniciarSincronizacionAutomatica() {
  // Sincronizar al cargar el archivo
  sincronizarConBD();
  
  // Sincronizar cada 5 minutos
  setInterval(sincronizarConBD, 5 * 60 * 1000);
  
  // Sincronizar cuando la ventana recupera el foco
  window.addEventListener('focus', sincronizarConBD);
  

})();

export { sincronizarConBD };
export default sincronizarConBD;