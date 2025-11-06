import React, { createContext, useState, useContext, useEffect } from "react";
import { storage } from './product/utils/storage';
import { sync } from './product/services/syncService';
import { useProductOperations } from './product/hooks/useProductOperations';
import sincronizarConBD from '../services/syncService';

const ProductContext = createContext();
export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  // Estados principales - Producto inicial ordenado por ID
  const [products, setProducts] = useState([
    { id: 2, name: "Servicio", price: 0, category: "Servicios", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" }
  ].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0)));
  const [categories, setCategories] = useState(["Servicios"]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Hook de operaciones
  const operations = useProductOperations(products, setProducts, categories, setCategories);

  // Funciones de sincronización
  const syncWithBackend = async () => {
    setIsSyncing(true);
    try {
      // Usar nuestra función de sincronización
      const result = await sincronizarConBD();
      return result;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadProductsFromBackend = async () => {
    setIsSyncing(true);
    try {
      await sync.fromBackend(setProducts, setCategories, products, categories);
      return true;
    } catch (error) {
      console.error("Error loading products from backend:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Inicialización
  useEffect(() => {
    const initialize = async () => {
      setIsSyncing(true);
      await sync.fromBackend(setProducts, setCategories, products, categories);
      sync.withInventory(setProducts);
      setIsSyncing(false);
    };

    initialize();

    const syncInterval = setInterval(() => sincronizarConBD(), 60000); // Sincronizar cada 60 segundos

    const handleStorageChange = (e) => {
      if (e.key === 'products') {
        const newProducts = storage.get('products');
        if (newProducts.length > 0) setProducts(newProducts);
      } else if (e.key === 'productos') {
        sync.withInventory(setProducts);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);  // Eliminadas las dependencias que causaban bucles

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      isSyncing,
      syncWithBackend,
      loadProductsFromBackend,
      ...operations
    }}>
      {children}
    </ProductContext.Provider>
  );
};