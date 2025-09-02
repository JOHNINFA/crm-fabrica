// Servicio simple que funciona igual que localStorage pero guarda en PostgreSQL
const API_URL = 'http://localhost:8000/api';

export const simpleStorage = {
  // Guardar datos en PostgreSQL y localStorage
  async setItem(key, data) {
    try {
      // Guardar en localStorage inmediatamente
      localStorage.setItem(key, JSON.stringify(data));
      
      // Intentar guardar en PostgreSQL
      const partes = key.split('_');
      const [tipo, dia, idSheet, fecha] = partes;
      const fechaGuardado = fecha || new Date().toISOString().split('T')[0];
      
      if (tipo === 'cargue') {
        const vendedorMap = { 'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6 };
        const vendedorId = vendedorMap[idSheet] || 1;
        
        // Crear/obtener cargue
        const cargueData = {
          dia: dia.toUpperCase(),
          fecha: fechaGuardado,
          usuario: 'Sistema',
          vendedor: vendedorId
        };
        
        const checkResponse = await fetch(`${API_URL}/cargues/?dia=${dia.toUpperCase()}&vendedor=${vendedorId}&fecha=${fechaGuardado}`);
        
        let cargue;
        if (checkResponse.ok) {
          const existentes = await checkResponse.json();
          
          if (existentes.length > 0) {
            cargue = existentes[0];
          } else {
            const createResponse = await fetch(`${API_URL}/cargues/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cargueData)
            });
            
            if (createResponse.ok) {
              cargue = await createResponse.json();
            }
          }
        }
        
        // Guardar productos
        if (cargue && data.productos) {
          for (const producto of data.productos) {
            if (producto.cantidad > 0 || producto.vendedor || producto.despachador) {
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
              
              // Verificar si existe
              const checkDetalle = await fetch(`${API_URL}/detalle-cargues/?cargue=${cargue.id}&producto=${producto.id}`);
              
              if (checkDetalle.ok) {
                const existentes = await checkDetalle.json();
                
                if (existentes.length > 0) {
                  // Actualizar
                  await fetch(`${API_URL}/detalle-cargues/${existentes[0].id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(detalleData)
                  });
                } else {
                  // Crear
                  await fetch(`${API_URL}/detalle-cargues/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(detalleData)
                  });
                }
              }
            }
          }
        }
      } else {
        // Otros tipos de datos
      }
      
      return true;
    } catch (error) {

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
      
      // Si no está en localStorage, buscar en PostgreSQL
      const partes = key.split('_');
      const [tipo, dia, idSheet, fecha] = partes;
      
      if (tipo === 'cargue' && fecha) {
        const vendedorMap = { 'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6 };
        const vendedorId = vendedorMap[idSheet] || 1;
        
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
              
              // Guardar en localStorage para próximas consultas
              localStorage.setItem(key, JSON.stringify(datosFormateados));
              
              return datosFormateados;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
};