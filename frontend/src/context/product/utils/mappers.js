// Mapeo de datos entre frontend y backend
export const mappers = {
  toFrontend: (product) => {
    // Obtener existencias reales del inventario (localStorage)
    const inventoryProducts = JSON.parse(localStorage.getItem('productos') || '[]');
    const inventoryProduct = inventoryProducts.find(inv => inv.id === product.id);
    const realStock = inventoryProduct ? (inventoryProduct.existencias || 0) : (product.stock_total || 0);
    
    return {
      id: product.id,
      name: product.nombre,
      price: parseFloat(product.precio) || 0,
      purchasePrice: parseFloat(product.precio_compra) || 0,
      stock: realStock,
      category: product.categoria_nombre || 'General',
      brand: product.marca || 'GENERICA',
      tax: product.impuesto || 'IVA(0%)',
      image: product.imagen || null
    };
  },
  
  toBackend: (product, categoriaId = 3) => ({
    nombre: product.name,
    precio: product.price,
    precio_compra: product.purchasePrice || 0,
    stock_total: product.stock || 0,
    categoria: categoriaId,
    marca: product.brand || 'GENERICA',
    impuesto: product.tax || 'IVA(0%)',
    activo: true,
    ...(product.image?.startsWith('data:') && { imagen: product.image })
  })
};