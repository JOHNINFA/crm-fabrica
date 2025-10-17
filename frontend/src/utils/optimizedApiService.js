// Servicio optimizado para llamadas API con caché inteligente
import { apiCache, cachedFetch } from './apiCache';
import { API_BASE_URL } from '../config/api';

class OptimizedApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.requestQueue = new Map(); // Para evitar llamadas duplicadas
    this.batchQueue = new Map();   // Para agrupar llamadas similares
    this.batchTimeout = 100;       // 100ms para agrupar llamadas
  }

  // Prevenir llamadas duplicadas simultáneas
  async preventDuplicateCall(key, apiCall) {
    if (this.requestQueue.has(key)) {
      console.log(`⏳ ESPERANDO LLAMADA DUPLICADA: ${key}`);
      return await this.requestQueue.get(key);
    }

    const promise = apiCall();
    this.requestQueue.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  // Obtener responsable con caché optimizado
  async obtenerResponsable(idVendedor) {
    const cacheKey = `responsable_${idVendedor}`;
    
    return await this.preventDuplicateCall(cacheKey, async () => {
      try {
        const response = await cachedFetch(
          `${this.baseUrl}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`,
          {},
          'responsables',
          { idVendedor }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`${response.fromCache ? '⚡ CACHÉ' : '🌐 API'} - Responsable ${idVendedor}: ${data.responsable}`);
          return data.responsable || 'RESPONSABLE';
        }
        
        return 'RESPONSABLE';
      } catch (error) {
        console.error(`❌ Error obteniendo responsable ${idVendedor}:`, error);
        return 'RESPONSABLE';
      }
    });
  }

  // Obtener múltiples responsables en lote
  async obtenerResponsablesLote(idsVendedores) {
    const cacheKey = `responsables_lote_${idsVendedores.join('_')}`;
    
    return await this.preventDuplicateCall(cacheKey, async () => {
      try {
        // Verificar cuáles están en caché
        const resultados = {};
        const idsPendientes = [];

        for (const id of idsVendedores) {
          const cached = apiCache.get('responsables', { idVendedor: id });
          if (cached) {
            resultados[id] = cached.responsable || 'RESPONSABLE';
            console.log(`⚡ CACHÉ - Responsable ${id}: ${resultados[id]}`);
          } else {
            idsPendientes.push(id);
          }
        }

        // Hacer llamadas solo para los que no están en caché
        if (idsPendientes.length > 0) {
          console.log(`🌐 API LOTE - Cargando responsables: ${idsPendientes.join(', ')}`);
          
          const promesas = idsPendientes.map(async (id) => {
            try {
              const response = await fetch(`${this.baseUrl}/vendedores/obtener_responsable/?id_vendedor=${id}`);
              if (response.ok) {
                const data = await response.json();
                const responsable = data.responsable || 'RESPONSABLE';
                
                // Guardar en caché individual
                apiCache.set('responsables', { responsable }, { idVendedor: id });
                
                return { id, responsable };
              }
              return { id, responsable: 'RESPONSABLE' };
            } catch (error) {
              console.error(`❌ Error para ${id}:`, error);
              return { id, responsable: 'RESPONSABLE' };
            }
          });

          const respuestas = await Promise.all(promesas);
          respuestas.forEach(({ id, responsable }) => {
            resultados[id] = responsable;
          });
        }

        return resultados;
      } catch (error) {
        console.error('❌ Error obteniendo responsables en lote:', error);
        const fallback = {};
        idsVendedores.forEach(id => {
          fallback[id] = 'RESPONSABLE';
        });
        return fallback;
      }
    });
  }

  // Actualizar responsable con invalidación de caché
  async actualizarResponsable(idVendedor, responsable) {
    try {
      console.log(`🔄 Actualizando responsable: ${idVendedor} -> ${responsable}`);

      const response = await fetch(`${this.baseUrl}/vendedores/actualizar_responsable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_vendedor: idVendedor,
          responsable: responsable
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Invalidar caché relacionado
        apiCache.invalidate('responsables', { idVendedor });
        apiCache.set('responsables', { responsable }, { idVendedor });
        
        console.log('✅ Responsable actualizado y caché invalidado');
        return data;
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error actualizando responsable:', error);
      throw error;
    }
  }

  // Obtener productos con caché
  async obtenerProductos() {
    const cacheKey = 'productos_all';
    
    return await this.preventDuplicateCall(cacheKey, async () => {
      try {
        const response = await cachedFetch(
          `${this.baseUrl}/productos/`,
          {},
          'productos'
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`${response.fromCache ? '⚡ CACHÉ' : '🌐 API'} - Productos cargados: ${data.length}`);
          return data;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        return [];
      }
    });
  }

  // Actualizar stock con optimización
  async actualizarStock(productoId, cantidad, nota = '') {
    try {
      console.log(`🔄 Actualizando stock: Producto ${productoId}, Cantidad: ${cantidad}`);

      const response = await fetch(`${this.baseUrl}/productos/${productoId}/actualizar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad_cambio: cantidad,
          nota: nota || 'Actualización desde cargue'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Invalidar caché de productos
        apiCache.invalidate('productos');
        apiCache.invalidate('stock', { productoId });
        
        console.log('✅ Stock actualizado y caché invalidado');
        return data;
      } else {
        throw new Error('Error actualizando stock');
      }
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
  