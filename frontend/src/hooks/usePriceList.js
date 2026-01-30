import { useState, useEffect, useCallback } from 'react';
import { listaPrecioService, precioProductoService } from '../services/listaPrecioService';

// Caché global de precios con timestamp - ahora guarda TODAS las listas
const preciosCache = {};
const CACHE_DURATION = 300000; // 5 minutos (antes 60 segundos)
let isPreloading = false;
let preloadPromise = null;

// Función para limpiar toda la caché
export const clearPriceCache = () => {
  Object.keys(preciosCache).forEach(key => delete preciosCache[key]);
  console.log('🗑️ Caché de precios limpiado');
};

// Función para pre-cargar TODAS las listas de precios
const preloadAllPriceLists = async () => {
  if (isPreloading) {
    return preloadPromise;
  }

  isPreloading = true;
  preloadPromise = (async () => {
    try {
      console.log('🚀 Pre-cargando todas las listas de precios...');
      
      // Obtener todas las listas activas
      const listas = await listaPrecioService.getAll({ activo: true });
      
      // Cargar precios de todas las listas en paralelo
      const promises = listas.map(async (lista) => {
        const cacheKey = `lista_${lista.nombre}`;
        
        // Si ya está en caché y no ha expirado, no recargar
        const now = Date.now();
        if (preciosCache[cacheKey] && (now - preciosCache[cacheKey].timestamp) < CACHE_DURATION) {
          return;
        }
        
        const todosPrecios = await precioProductoService.getAll({ lista_precio: lista.id });
        
        // Crear mapa de precios por producto
        const preciosMap = {};
        todosPrecios.forEach(precio => {
          preciosMap[precio.producto] = precio.precio;
        });
        
        // Guardar en caché
        preciosCache[cacheKey] = { 
          data: preciosMap, 
          timestamp: Date.now() 
        };
        
        console.log(`✅ Lista "${lista.nombre}" cargada (${todosPrecios.length} precios)`);
      });
      
      await Promise.all(promises);
      console.log('✅ Todas las listas pre-cargadas');
    } catch (error) {
      console.error('❌ Error pre-cargando listas:', error);
    } finally {
      isPreloading = false;
    }
  })();
  
  return preloadPromise;
};

export const usePriceList = (priceListName, products) => {
  const [precios, setPrecios] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pre-cargar todas las listas al montar el hook por primera vez
  useEffect(() => {
    preloadAllPriceLists();
  }, []);

  // Forzar recarga cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      clearPriceCache();
      setRefreshKey(prev => prev + 1);
      preloadAllPriceLists();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (!priceListName || !products || products.length === 0) {
      return;
    }

    const cacheKey = `lista_${priceListName}`;
    const now = Date.now();

    // Verificar si hay caché válida - aplicar inmediatamente
    if (preciosCache[cacheKey] && (now - preciosCache[cacheKey].timestamp) < CACHE_DURATION) {
      setPrecios(preciosCache[cacheKey].data);
      return;
    }

    // Si está pre-cargando, esperar y luego usar caché
    if (isPreloading && preloadPromise) {
      preloadPromise.then(() => {
        if (preciosCache[cacheKey]) {
          setPrecios(preciosCache[cacheKey].data);
        }
      });
      return;
    }

    // Si no hay caché, cargar desde API
    const cargarPrecios = async () => {
      setLoading(true);
      try {
        // Obtener la lista de precios
        const listas = await listaPrecioService.getAll({ activo: true });
        const lista = listas.find(l => l.nombre === priceListName);

        if (!lista) {
          setPrecios({});
          preciosCache[cacheKey] = { data: {}, timestamp: now };
          return;
        }

        // Cargar TODOS los precios de esta lista de una vez
        const todosPrecios = await precioProductoService.getAll({ lista_precio: lista.id });

        // Crear mapa de precios por producto
        const preciosMap = {};
        todosPrecios.forEach(precio => {
          preciosMap[precio.producto] = precio.precio;
        });

        // Guardar en caché con timestamp
        preciosCache[cacheKey] = { data: preciosMap, timestamp: now };
        setPrecios(preciosMap);
      } catch (error) {
        console.error('Error cargando precios:', error);
        setPrecios({});
      } finally {
        setLoading(false);
      }
    };

    cargarPrecios();
  }, [priceListName, products, refreshKey]);

  return { precios, loading };
};
