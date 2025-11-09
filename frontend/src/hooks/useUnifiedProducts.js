/**
 * Hook personalizado para usar el contexto unificado de productos
 * 
 * Este hook proporciona una interfaz compatible con los hooks anteriores
 * (useProducts y useProductos) para facilitar la migración
 */

import { useUnifiedProducts as useUnifiedProductsContext } from '../context/UnifiedProductContext';

export const useUnifiedProducts = () => {
  return useUnifiedProductsContext();
};

// Alias para compatibilidad con ProductContext (POS/Pedidos)
export const useProducts = () => {
  const context = useUnifiedProductsContext();
  
  return {
    products: context.products,
    categories: context.categories,
    isSyncing: context.isSyncing,
    isInitialLoading: context.isInitialLoading,
    addProduct: context.addProduct,
    updateProduct: context.updateProduct,
    deleteProduct: context.deleteProduct,
    updateStock: context.updateStock,
    reorderProducts: context.reorderProducts,
    addCategory: context.addCategory,
    removeCategory: context.removeCategory,
    syncWithBackend: context.syncWithBackend,
    loadProductsFromBackend: context.loadProductsFromBackend,
    updateProducts: async (newProducts) => {
      // Actualizar múltiples productos
      for (const product of newProducts) {
        await context.updateProduct(product.id, product);
      }
      return true;
    },
    addToCart: async (productId) => {
      const product = context.products.find(p => p.id === productId);
      if (!product || product.stock <= 0) return false;
      
      await context.updateStock(productId, Math.max(0, product.stock - 1));
      return true;
    }
  };
};

// Alias para compatibilidad con ProductosContext (Inventario)
export const useProductos = () => {
  const context = useUnifiedProductsContext();
  
  // Convertir productos a formato inventario
  const productos = context.products.map(context.toInventoryFormat);
  
  return {
    productos,
    movimientos: [], // Los movimientos se manejan por separado
    isSyncing: context.isSyncing,
    actualizarExistencias: context.actualizarExistencias,
    agregarMovimientos: () => {
      console.warn('agregarMovimientos debe manejarse por separado');
    },
    sincronizarConBackend: context.loadFromBackend
  };
};

export default useUnifiedProducts;
