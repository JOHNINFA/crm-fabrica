import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/storage';
import { mappers } from '../utils/mappers';
import { sync } from '../services/syncService';
import { productoService, categoriaService } from '../../../services/api';
import { syncService, sincronizarConBD } from '../../../services/syncService';

export const useProductOperations = (products, setProducts, categories, setCategories) => {
  
  // Utilidad para actualizar estado y localStorage
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

  const removeCategory = async (categoryToRemove) => {
    if (categories.length <= 1) return false;
    
    const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || "Sin categoría";
    const updatedProducts = products.map(product => 
      product.category === categoryToRemove ? { ...product, category: fallbackCategory } : product
    );
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    
    try {
      // Intentar eliminar del backend
      const categoriasMap = await getCategoriesMap();
      const categoryId = categoriasMap[categoryToRemove.toLowerCase()];
      
      if (categoryId) {
        await categoriaService.delete(categoryId);
      }
    } catch (error) {
      console.error('Error deleting category from backend:', error);
      // Encolar operación para sincronización posterior
      syncService.queueOperation('CATEGORY_DELETE', { nombre: categoryToRemove });
    }
    
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
    // Crear un objeto de producto consistente
    let productToSave = {
      nombre: productData.nombre,
      precio: productData.precioVenta || productData.precio || 0,
      precio_compra: productData.precioCompra || 0,
      marca: productData.marca || "GENERICA",
      impuesto: productData.impuesto || "IVA(0%)",
      stock_total: 0, // Los productos del POS inician sin stock
      activo: true,
      imagen: productData.imagen
    };
    
    // Obtener el ID de la categoría
    try {
      const categoriasMap = await getCategoriesMap();
      const categoriaName = productData.categoria || "General";
      let categoriaId = categoriasMap[categoriaName.toLowerCase()];
      
      // Si la categoría no existe, crearla
      if (!categoriaId) {
        try {
          console.log(`Creando categoría: ${categoriaName}`);
          const createdCat = await categoriaService.create(categoriaName);
          if (createdCat?.id) {
            categoriaId = createdCat.id;
            console.log(`Categoría creada con ID: ${categoriaId}`);
          }
        } catch (error) {
          console.error(`Error al crear categoría ${categoriaName}:`, error);
          // Usar categoría General por defecto
          categoriaId = categoriasMap['general'] || 3;
        }
      }
      
      // Asignar el ID de la categoría al producto
      productToSave.categoria = categoriaId;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      // Usar categoría General por defecto
      productToSave.categoria = 3;
    }
    
    // Intentar guardar directamente en el backend primero
    try {
      console.log('Intentando guardar producto en el backend:', productToSave);
      
      let savedProduct;
      let backendId;
      
      if (productData.id && !productData.id.toString().includes('-')) {
        // Actualizar producto existente
        savedProduct = await productoService.update(productData.id, productToSave);
        backendId = productData.id;
      } else {
        // Crear nuevo producto
        savedProduct = await productoService.create(productToSave);
        backendId = savedProduct?.id;
      }
      
      console.log('Producto guardado en backend:', savedProduct);
      
      // Crear objeto para el estado local (productos del POS inician con stock 0)
      const newProduct = {
        id: backendId || productData.id || uuidv4(),
        name: productData.nombre,
        price: productData.precioVenta || productData.precio || 0,
        category: productData.categoria || "General",
        image: productData.imagen,
        stock: 0, // Los productos del POS inician sin stock
        purchasePrice: productData.precioCompra || 0,
        brand: productData.marca || "GENERICA",
        tax: productData.impuesto || "IVA(0%)"
      };
      
      // Actualizar estado local
      const updatedProducts = productData.id
        ? products.map(p => p.id === productData.id ? newProduct : p)
        : [...products, newProduct];
      
      updateState(updatedProducts);
      
      // Sincronizar con inventario (sin existencias iniciales)
      const inventoryProducts = storage.get('productos', []);
      const newInventoryProduct = {
        id: newProduct.id,
        nombre: newProduct.name,
        existencias: 0, // Los productos del POS inician sin existencias
        precio: newProduct.price,
        categoria: newProduct.category,
        cantidad: 0  // Importante para el inventario de producción
      };
      
      // Actualizar o agregar al inventario
      const updatedInventory = inventoryProducts.some(p => p.id === newProduct.id)
        ? inventoryProducts.map(p => p.id === newProduct.id ? newInventoryProduct : p)
        : [...inventoryProducts, newInventoryProduct];
      
      storage.save('productos', updatedInventory);
      
      // Crear registro de inventario automáticamente
      try {
        // Registrar movimiento de inventario para el nuevo producto
        syncService.queueOperation('MOVEMENT_CREATE', {
          producto: newProduct.id,
          tipo: 'ENTRADA',
          cantidad: 0,  // Inicialmente sin stock
          usuario: 'Sistema POS',
          nota: 'Registro automático desde POS'
        });
        console.log('✅ Producto creado con registro automático de inventario:', newProduct.name);
      } catch (error) {
        console.error('Error al crear registro de inventario:', error);
      }
      
      // Forzar sincronización inmediata
      syncService.syncAllToBackend();
      
      // Notificar cambios
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      return newProduct;
    } catch (error) {
      console.error('Error guardando producto en backend:', error);
      
      // Fallback: guardar localmente y encolar para sincronización
      const newProduct = {
        id: productData.id || uuidv4(),
        name: productData.nombre,
        price: productData.precioVenta || productData.precio || 0,
        category: productData.categoria || "General",
        image: productData.imagen,
        stock: 0, // Los productos del POS inician sin stock
        purchasePrice: productData.precioCompra || 0,
        brand: productData.marca || "GENERICA",
        tax: productData.impuesto || "IVA(0%)"
      };
      
      // Actualizar estado local
      const updatedProducts = productData.id
        ? products.map(p => p.id === productData.id ? newProduct : p)
        : [...products, newProduct];
      
      updateState(updatedProducts);
      
      // Encolar para sincronización posterior
      syncService.queueOperation('PRODUCT_CREATE', {
        nombre: newProduct.name,
        precio: newProduct.price,
        precio_compra: newProduct.purchasePrice || 0,
        categoria: 3, // ID por defecto para "General"
        marca: newProduct.brand || "GENERICA",
        impuesto: newProduct.tax || "IVA(0%)",
        stock_total: 0, // Los productos del POS inician sin stock
        activo: true,
        ...(newProduct.image && { imagen: newProduct.image })
      });
      
      // Sincronizar con inventario (sin existencias iniciales)
      const inventoryProducts = storage.get('productos', []);
      const newInventoryProduct = {
        id: newProduct.id,
        nombre: newProduct.name,
        existencias: 0, // Los productos del POS inician sin existencias
        precio: newProduct.price,
        categoria: newProduct.category,
        cantidad: 0  // Importante para el inventario de producción
      };
      
      // Actualizar o agregar al inventario
      const updatedInventory = inventoryProducts.some(p => p.id === newProduct.id)
        ? inventoryProducts.map(p => p.id === newProduct.id ? newInventoryProduct : p)
        : [...inventoryProducts, newInventoryProduct];
      
      storage.save('productos', updatedInventory);
      
      // Encolar registro de inventario automáticamente
      try {
        // Registrar movimiento de inventario para el nuevo producto
        syncService.queueOperation('MOVEMENT_CREATE', {
          producto: newProduct.id,
          tipo: 'ENTRADA',
          cantidad: 0,  // Inicialmente sin stock
          usuario: 'Sistema POS',
          nota: 'Registro automático desde POS (offline)'
        });
        console.log('✅ Producto guardado localmente con registro automático de inventario:', newProduct.name);
      } catch (error) {
        console.error('Error al encolar registro de inventario:', error);
      }
      
      // Forzar procesamiento de la cola
      setTimeout(() => {
        syncService.processSyncQueue();
        // Notificar cambios
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('productosUpdated'));
      }, 1000);
      
      return newProduct;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const updatedProducts = products.filter(product => product.id !== productId);
      updateState(updatedProducts);
      
      const inventoryProducts = storage.get('productos');
      const updatedInventoryProducts = inventoryProducts.filter(product => product.id !== productId);
      storage.save('productos', updatedInventoryProducts);
      
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