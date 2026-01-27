import { useState, useEffect, useCallback } from 'react';
import { listaPrecioService, precioProductoService } from '../services/listaPrecioService';

// Caché global de precios con timestamp
const preciosCache = {};
const CACHE_DURATION = 2000; // 2 segundos para reflejar cambios más rápido

// Función para limpiar toda la caché
export const clearPriceCache = () => {
  Object.keys(preciosCache).forEach(key => delete preciosCache[key]);
  console.log('🗑️ Caché de precios limpiado');
};

export const usePriceList = (priceListName, products) => {
  const [precios, setPrecios] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar recarga cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      clearPriceCache();
      setRefreshKey(prev => prev + 1);
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

    // Verificar si hay caché válida
    if (preciosCache[cacheKey] && (now - preciosCache[cacheKey].timestamp) < CACHE_DURATION) {
      setPrecios(preciosCache[cacheKey].data);
      return;
    }

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
