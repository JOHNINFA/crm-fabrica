// Servicio simple que funciona igual que localStorage pero guarda en PostgreSQL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Cache para evitar consultas repetitivas
const cache = new Map();
const pendingSaves = new Map();

export const simpleStorage = {
  // Guardar datos en PostgreSQL y localStorage
  async setItem(key, data) {
    try {
      // Guardar en localStorage inmediatamente
      localStorage.setItem(key, JSON.stringify(data));
      
      // Debounce: cancelar guardado anterior si existe
      if (pendingSaves.has(key)) {
        clearTimeout(pendingSaves.get(key));
      }
      
      // Programar guardado en 2 segundos
      const timeoutId = setTimeout(async () => {
        await this._saveToBackend(key, data);
        pendingSaves.delete(key);
      }, 2000);
      
      pendingSaves.set(key, timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Método privado para guardar en backend
  async _saveToBackend(key, data) {
    try {
      const partes = key.split('_');
      const [tipo, dia, idSheet, fecha] = partes;
      const fechaGuardado = fecha || new Date().toISOString().split('T')[0];
      
      if (tipo === 'cargue') {
        console.log(`💾 Guardando en backend: ${key}`);
        
        const vendedorMap = { 'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6 };
        const vendedorId = vendedorMap[idSheet] || 1;
        
        // Usar cache para evitar consultas repetitivas
        const cacheKey = `${dia}_${vendedorId}_${fechaGuardado}`;
        let cargue = cache.get(cacheKey);
        
        if (!cargue) {
          // Solo consultar si no está en cache
          const checkResponse = await fetch(`${API_URL}/cargues/?dia=${dia.toUpperCase()}&vendedor=${vendedorId}&fecha=${fechaGuardado}`);
          
          if (checkResponse.ok) {
            const existentes = await checkResponse.json();
            
            if (existentes.length > 0) {
              cargue = existentes[0];
            } else {
              const cargueData = {
                dia: dia.toUpperCase(),
                fecha: fechaGuardado,
                usuario: 'Sistema',
                vendedor: vendedorId
              };
              
              const createResponse = await fetch(`${API_URL}/cargues/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cargueData)
              });
              
              if (createResponse.ok) {
                cargue = await createResponse.json();
              }
            }
            
            // Guardar en cache por 5 minutos
            if (cargue) {
              cache.set(cacheKey, cargue);
              setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
            }
          }
        }
        
        // Solo guardar productos con datos relevantes
        if (cargue && data.productos) {
          const productosConDatos = data.productos.filter(p => 
            p.cantidad > 0 || p.vendedor || p.despachador || p.dctos > 0 || p.adicional > 0 || p.devoluciones > 0 || p.vencidas > 0 || (p.lotesVencidos && p.lotesVencidos.length > 0)
          );
          
          console.log(`📦 Guardando ${productosConDatos.length} productos con datos`);
          
          // Procesar productos en lotes para reducir consultas
          for (const producto of productosConDatos) {
            const detalleData = {
              cargue: cargue.id,
              producto: producto.id,
              vendedor_check: producto.vendedor || false,
              despachador_check: producto.despachador || false,
              cantidad: producto.cantidad,
              dctos: producto.dctos || 0,
              adicional: producto.adicional || 0,
              devoluciones: producto.devoluciones || 0,
              vencidas: producto.vencidas || 0,
              valor: producto.valor || 0
            };
            
            let detalleId = null;
            
            // Intentar crear directamente, si falla entonces actualizar
            try {
              const createResponse = await fetch(`${API_URL}/detalle-cargues/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detalleData)
              });
              
              if (createResponse.ok) {
                const detalle = await createResponse.json();
                detalleId = detalle.id;
              }
            } catch {
              // Si falla (probablemente existe), intentar actualizar
              const checkDetalle = await fetch(`${API_URL}/detalle-cargues/?cargue=${cargue.id}&producto=${producto.id}`);
              if (checkDetalle.ok) {
                const existentes = await checkDetalle.json();
                if (existentes.length > 0) {
                  detalleId = existentes[0].id;
                  await fetch(`${API_URL}/detalle-cargues/${detalleId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(detalleData)
                  });
                }
              }
            }
            
            // Guardar lotes vencidos si existen
            if (detalleId && producto.lotesVencidos && producto.lotesVencidos.length > 0) {
              console.log(`🏷️ Guardando ${producto.lotesVencidos.length} lotes vencidos para ${producto.producto}`);
              
              // Primero eliminar lotes existentes para este detalle
              try {
                const lotesExistentes = await fetch(`${API_URL}/lotes-vencidos/?detalle_cargue=${detalleId}`);
                if (lotesExistentes.ok) {
                  const lotes = await lotesExistentes.json();
                  for (const lote of lotes) {
                    await fetch(`${API_URL}/lotes-vencidos/${lote.id}/`, {
                      method: 'DELETE'
                    });
                  }
                }
              } catch (error) {
                console.warn('Error eliminando lotes existentes:', error);
              }
              
              // Crear nuevos lotes vencidos
              for (const loteVencido of producto.lotesVencidos) {
                if (loteVencido.lote && loteVencido.motivo) {
                  try {
                    await fetch(`${API_URL}/lotes-vencidos/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        detalle_cargue: detalleId,
                        lote: loteVencido.lote,
                        motivo: loteVencido.motivo,
                        usuario: 'Sistema'
                      })
                    });
                  } catch (error) {
                    console.error('Error guardando lote vencido:', error);
                  }
                }
              }
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error guardando en backend:', error);
      return false;
    }
  },

  // Obtener datos (localStorage + PostgreSQL)
  async getItem(key) {
    try {
      // Primero intentar localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Solo buscar en PostgreSQL si realmente es necesario
      console.log(`🔍 Buscando en backend: ${key}`);
      
      const partes = key.split('_');
      const [tipo, dia, idSheet, fecha] = partes;
      
      if (tipo === 'cargue' && fecha) {
        const vendedorMap = { 'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6 };
        const vendedorId = vendedorMap[idSheet] || 1;
        
        // Usar cache para datos ya consultados
        const cacheKey = `data_${dia}_${vendedorId}_${fecha}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
        
        // Buscar cargue en PostgreSQL
        const response = await fetch(`${API_URL}/cargues/?dia=${dia.toUpperCase()}&vendedor=${vendedorId}&fecha=${fecha}`);
        
        if (response.ok) {
          const cargues = await response.json();
          
          if (cargues.length > 0) {
            const cargue = cargues[0];
            
            // Obtener detalles del cargue
            const detallesResponse = await fetch(`${API_URL}/detalle-cargues/?cargue=${cargue.id}`);
            
            if (detallesResponse.ok) {
              const detalles = await detallesResponse.json();
              
              // Formatear datos para el frontend
              const productos = detalles.map(detalle => ({
                id: detalle.producto,
                producto: detalle.producto_nombre || `Producto ${detalle.producto}`,
                cantidad: detalle.cantidad || 0,
                dctos: detalle.dctos || 0,
                adicional: detalle.adicional || 0,
                devoluciones: detalle.devoluciones || 0,
                vencidas: detalle.vencidas || 0,
                total: detalle.total || 0,
                valor: detalle.valor || 0,
                neto: detalle.neto || 0,
                vendedor: detalle.vendedor_check || false,
                despachador: detalle.despachador_check || false
              }));
              
              const datosFormateados = {
                dia,
                idSheet,
                fecha,
                productos,
                timestamp: Date.now()
              };
              
              // Guardar en localStorage y cache
              localStorage.setItem(key, JSON.stringify(datosFormateados));
              cache.set(cacheKey, datosFormateados);
              
              // Limpiar cache después de 5 minutos
              setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
              
              return datosFormateados;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo datos:', error);
      return null;
    }
  }
};