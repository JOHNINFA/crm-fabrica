import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/storage';
import { mappers } from '../utils/mappers';
import { sync } from '../services/syncService';
import { productoService, categoriaService } from '../../../services/api';
import { syncService } from '../../../services/syncService';

export const useProductOperations = (products, setProducts, categories, setCategories) => {
  
  // Utilidades comunes
  const updateState = (newProducts, newCategories = null) => {
    setProducts(newProducts);
    storage.save('products', newProducts);
    
    if (newCategories) {
      setCategories(newCategories);
      storage.save('categories', newCategories);
    } else {
      const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
        storage.save('categories', uniqueCategories);
      }
    }
  };

  const getCategoriesMap = async () => {
    try {
      const backendCategorias = await categoriaService.getAll();
      return backendCategorias?.reduce((map, cat) => {
        map[cat.nombre.toLowerCase()] = cat.id;
        return map;
      }, {}) || {};
    } catch (error) {
      console.error("Error loading categories map:", error);
      return {};
    }
  };

  const createMissingCategories = async (categories, categoriasMap) => {
    for (const categoryName of categories) {
      if (!categoriasMap[categoryName.toLowerCase()]) {
        try {
          const createdCat = await categoriaService.create(categoryName);
          if (createdCat?.id) categoriasMap[categoryName.toLowerCase()] = createdCat.id;
        } catch (error) {
          console.error(`Error creating category ${categoryName}:`, error);
        }
      }
    }
  };

  // Operaciones principales
  const updateProducts = async (newProducts) => {
    try {
      updateState(newProducts);
      await sync.toBackend(newProducts, getCategoriesMap, createMissingCategories);
      return true;
    } catch (error) {
      console.error("Error updating products:", error);
      return false;
    }
  };

  const addCategory = async (newCategory) => {
    if (!newCategory || categories.includes(newCategory)) return false;
    
    const updatedCategories = [...categories, newCategory];
    
    try {
      await categoriaService.create(newCategory);
      updateState(products, updatedCategories);
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      updateState(products, updatedCategories);
      syncService.queueOperation('CATEGORY_CREATE', { nombre: newCategory });
      return true;
    }
  };

  const removeCategory = (categoryToRemove) => {
    if (categories.length <= 1) return false;
    
    const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || "Sin categoría";
    const updatedProducts = products.map(product => 
      product.category === categoryToRemove ? { ...product, category: fallbackCategory } : product
    );
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    
    updateState(updatedProducts, updatedCategories);
    return true;
  };

  const updateStock = async (productId, newStock, usuario = 'Sistema', nota = '') => {
    const product = products.find(p => p.id === productId);
    if (!product || newStock === product.stock) return false;
    
    try {
      await productoService.updateStock(productId, newStock - product.stock, usuario, nota);
      
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      updateState(updatedProducts);
      
      // Sincronizar inventario
      const inventoryProducts = storage.get('productos');
      const updatedInventoryProducts = inventoryProducts.map(invProduct => 
        invProduct.id === productId ? { ...invProduct, existencias: newStock } : invProduct
      );
      storage.save('productos', updatedInventoryProducts);
      
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  };

  const createProductObject = (productData, createdId = null) => ({
    id: createdId || productData.id || uuidv4(),
    name: productData.nombre,
    price: productData.precioVenta || 0,
    category: productData.categoria,
    image: productData.imagen,
    stock: productData.existencias || 0,
    purchasePrice: productData.precioCompra || 0,
  });

  const addProduct = async (productData) => {
    try {
      const categoriasMap = await getCategoriesMap();
      const categoriaId = categoriasMap[productData.categoria?.toLowerCase()] || 3;
      const backendData = mappers.toBackend(productData, categoriaId);
      
      if (productData.id) {
        // Actualizar existente
        await productoService.update(productData.id, backendData);
        const updatedProducts = products.map(product => 
          product.id === productData.id ? { ...product, ...productData } : product
        );
        updateState(updatedProducts);
        return updatedProducts.find(p => p.id === productData.id);
      } else {
        // Crear nuevo
        const createdProduct = await productoService.create(backendData);
        const newProduct = createProductObject(productData, createdProduct.id);
        const updatedProducts = [...products, newProduct];
        updateState(updatedProducts);
        return newProduct;
      }
    } catch (error) {
      console.error('Error adding/updating product:', error);
      // Fallback local
      const newProduct = createProductObject(productData);
      const updatedProducts = productData.id 
        ? products.map(p => p.id === productData.id ? { ...p, ...newProduct } : p)
        : [...products, newProduct];
      
      updateState(updatedProducts);
      return newProduct;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const updatedProducts = products.filter(product => product.id !== productId);
      updateState(updatedProducts);
      
      // Limpiar inventario
      const inventoryProducts = storage.get('productos');
      const updatedInventoryProducts = inventoryProducts.filter(product => product.id !== productId);
      storage.save('productos', updatedInventoryProducts);
      
      // Marcar inactivo en backend
      try {
        await productoService.update(productId, { activo: false });
      } catch (error) {
        syncService.queueOperation('PRODUCT_UPDATE', { id: productId, activo: false });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };

  const addToCart = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product || product.stock <= 0) return false;
      
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
      );
      
      updateState(updatedProducts);
      
      syncService.queueOperation('PRODUCT_UPDATE_STOCK', {
        id: productId,
        stock: updatedProducts.find(p => p.id === productId).stock,
        usuario: 'Usuario POS',
        nota: 'Venta desde POS'
      });
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  return {
    updateProducts,
    addCategory,
    removeCategory,
    updateStock,
    addProduct,
    deleteProduct,
    addToCart
  };
};