// Sistema de caché inteligente para optimizar llamadas al backend
class ApiCache {
  constructor() {
    this.defaultCacheDuration = 5 * 60 * 1000; // 5 minutos por defecto
    this.cacheConfig = {
      responsables: 10 * 60 * 1000, // 10 minutos para responsables
      productos: 15 * 60 * 1000,    // 15 minutos para productos
      vendedores: 10 * 60 * 1000,   // 10 minutos para vendedores
      stock: 5 * 60 * 1000,         // 5 minutos para stock
      sync: 2 * 60 * 1000           // 2 minutos para sincronización
    };
  }

  // Generar clave de caché
  generateKey(type, params = {}) {
    const baseKey = `api_cache_${type}`;
    if (Object.keys(params).length === 0) return baseKey;
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('_');
    
    return `${baseKey}_${paramString}`;
  }

  // Verificar si el caché es válido
  isValid(key, customDuration = null) {
    try {
      const timestampKey = `${key}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      
      if (!timestamp) return false;
      
      const now = Date.now();
      const cacheTime = parseInt(timestamp);
      const duration = customDuration || this.defaultCacheDuration;
      
      return (now - cacheTime) < duration;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  // Obtener datos del caché
  get(type, params = {}, customDuration = null) {
    try {
      const key = this.generateKey(type, params);
      const duration = customDuration || this.cacheConfig[type] || this.defaultCacheDuration;
      
      if (!this.isValid(key, duration)) {
        console.log(`🔍 CACHÉ EXPIRADO: ${key}`);
        return null;
      }
      
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      console.log(`⚡ CACHÉ HIT: ${key}`);
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  // Guardar datos en caché
  set(type, data, params = {}, customDuration = null) {
    try {
      const key = this.generateKey(type, params);
      const timestampKey = `${key}_timestamp`;
      
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
      
      console.log(`💾 CACHÉ GUARDADO: ${key}`);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Invalidar caché específico
  invalidate(type, params = {}) {
    try {
      const key = this.generateKey(type, params);
      const timestampKey = `${key}_timestamp`;
      
      localStorage.removeItem(key);
      localStorage.removeItem(timestampKey);
      
      console.log(`🗑️ CACHÉ INVALIDADO: ${key}`);
      return true;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  }

  // Limpiar todo el caché
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🧹 CACHÉ LIMPIADO: ${cacheKeys.length} entradas eliminadas`);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Obtener estadísticas del caché
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_') && !key.endsWith('_timestamp'));
      
      const stats = {
        totalEntries: cacheKeys.length,
        validEntries: 0,
        expiredEntries: 0,
        totalSize: 0
      };

      cacheKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          stats.totalSize += data.length;
          
          if (this.isValid(key)) {
            stats.validEntries++;
          } else {
            stats.expiredEntries++;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

// Instancia singleton
export const apiCache = new ApiCache();

// Wrapper para fetch con caché automático
export const cachedFetch = async (url, options = {}, cacheType = 'default', cacheParams = {}) => {
  try {
    // Intentar obtener del caché primero
    const cachedData = apiCache.get(cacheType, { url, ...cacheParams });
    if (cachedData) {
      return {
        ok: true,
        json: () => Promise.resolve(cachedData),
        fromCache: true
      };
    }

    // Si no hay caché, hacer la llamada real
    console.log(`🌐 API CALL: ${url}`);
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      
      // Guardar en caché solo si es GET
      if (!options.method || options.method === 'GET') {
        apiCache.set(cacheType, data, { url, ...cacheParams });
      }
      
      return {
        ...response,
        json: () => Promise.resolve(data),
        fromCache: false
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error in cachedFetch:', error);
    throw error;
  }
};

// Hook para React
export const useApiCache = () => {
  return {
    get: apiCache.get.bind(apiCache),
    set: apiCache.set.bind(apiCache),
    invalidate: apiCache.invalidate.bind(apiCache),
    clearAll: apiCache.clearAll.bind(apiCache),
    getStats: apiCache.getStats.bind(apiCache),
    cachedFetch
  };
};

export default apiCache;