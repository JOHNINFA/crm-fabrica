import { storage } from '../utils/storage';
import { mappers } from '../utils/mappers';
import { productoService, categoriaService } from '../../../services/api';

// Servicios de sincronización
export const sync = {
  withInventory: (setProducts) => {
    try {
      const inventoryProducts = storage.get('productos');
      const currentProducts = storage.get('products');
      
      const updatedProducts = currentProducts.map(posProduct => {
        const inventoryProduct = inventoryProducts.find(inv => inv.id === posProduct.id);
        return inventoryProduct ? { ...posProduct, stock: inventoryProduct.existencias } : posProduct;
      });
      
      // Ordenar productos en un orden específico
      const ordenProductos = {
        'AREPA TIPO OBLEA 500GR': 1,
        'AREPA MEDIANA 330GR': 2,
        'AREPA TIPO PINCHO 330GR': 3,
        'AREPA QUESO CORRIENTE 450GR': 4
      };
      
      updatedProducts.sort((a, b) => {
        const ordenA = ordenProductos[a.name?.toUpperCase()] || 999;
        const ordenB = ordenProductos[b.name?.toUpperCase()] || 999;
        return ordenA - ordenB;
      });
      
      const hasChanges = updatedProducts.some((product, index) => 
        product.stock !== currentProducts[index]?.stock || 
        product.id !== currentProducts[index]?.id
      );
      
      if (hasChanges) {
        setProducts(updatedProducts);
        storage.save('products', updatedProducts);
      }
    } catch (error) {
      console.error('Error syncing with inventory:', error);
    }
  },
  
  fromBackend: async (setProducts, setCategories, products, categories) => {
    try {
      // Cargar productos
      const backendProducts = await productoService.getAll();
      if (backendProducts?.length > 0 && !backendProducts.error) {
        const formattedProducts = backendProducts
          .filter(product => product.activo !== false)
          .map(mappers.toFrontend);
        
        if (formattedProducts.length > 0) {
          // Ordenar productos en un orden específico
          const ordenProductos = {
            'AREPA TIPO OBLEA 500GR': 1,
            'AREPA MEDIANA 330GR': 2,
            'AREPA TIPO PINCHO 330GR': 3,
            'AREPA QUESO CORRIENTE 450GR': 4
          };
          
          formattedProducts.sort((a, b) => {
            const ordenA = ordenProductos[a.name?.toUpperCase()] || 999;
            const ordenB = ordenProductos[b.name?.toUpperCase()] || 999;
            return ordenA - ordenB;
          });
          
          setProducts(formattedProducts);
          storage.save('products', formattedProducts);
        }
      }

      // Cargar categorías
      const backendCategories = await categoriaService.getAll();
      if (backendCategories?.length > 0 && !backendCategories.error) {
        const categoryNames = backendCategories.map(cat => cat.nombre);
        setCategories(categoryNames);
        storage.save('categories', categoryNames);
      }
    } catch (error) {
      console.error('Error loading from backend:', error);
      setProducts(storage.get('products', products));
      setCategories(storage.get('categories', categories));
    }
  },

  toBackend: async (newProducts, getCategoriesMap, createMissingCategories) => {
    try {
      const categoriasMap = await getCategoriesMap();
      const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
      
      if (uniqueCategories.length > 0) {
        await createMissingCategories(uniqueCategories, categoriasMap);
      }
      
      for (const product of newProducts) {
        try {
          const categoriaId = categoriasMap[product.category?.toLowerCase()] || 3;
          const productData = mappers.toBackend(product, categoriaId);
          
          if (product.id && !product.id.toString().includes('-')) {
            await productoService.update(product.id, productData);
          } else {
            const createdProduct = await productoService.create(productData);
            if (createdProduct?.id) product.id = createdProduct.id;
          }
        } catch (error) {
          console.error(`Error syncing product ${product.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error syncing with backend:", error);
    }
  }
};