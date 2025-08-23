// Servicio simple que funciona igual que localStorage pero guarda en PostgreSQL
const API_URL = 'http://localhost:8000/api';

export const simpleStorage = {
  // Guardar datos en PostgreSQL y localStorage
  async setItem(key, data) {
    try {
      // Guardar en localStorage inmediatamente
      localStorage.setItem(key, JSON.stringify(data));
      
      // Intentar guardar en PostgreSQL
      const [tipo, dia, idSheet] = key.split('_');
      
      if (tipo === 'cargue') {
        const vendedorMap = { 'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6 };
        const vendedorId = vendedorMap[idSheet] || 1;
        
        // Crear/obtener cargue
        const cargueData = {
          dia: dia.toUpperCase(),
          fecha: new Date().toISOString().split('T')[0],
          usuario: 'Sistema',
          vendedor: vendedorId
        };
        
        const checkResponse = await fetch(`${API_URL}/cargues/?dia=${dia.toUpperCase()}&vendedor=${vendedorId}&fecha=${cargueData.fecha}`);
        
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
            if (producto.cantidad > 0) {
              const detalleData = {
                cargue: cargue.id,
                producto: producto.id,
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

      }
      
      return true;
    } catch (error) {

      return false;
    }
  },

  // Obtener datos (solo localStorage por ahora)
  async getItem(key) {
    try {
      const localData = localStorage.getItem(key);
      if (localData) {

        return JSON.parse(localData);
      }
      return null;
    } catch (error) {

      return null;
    }
  }
};