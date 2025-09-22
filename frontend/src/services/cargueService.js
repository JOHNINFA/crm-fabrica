// Servicio para manejar las llamadas a la API de cargues
const API_URL = 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Cargues Operativos
export const cargueService = {
  // Obtener todos los cargues
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/cargues/?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener cargues: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Crear un nuevo cargue
  create: async (cargueData) => {
    try {
      const response = await fetch(`${API_URL}/cargues/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cargueData),
      });

      if (!response.ok) {
        throw new Error(`Error al crear cargue: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obtener un cargue por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/cargues/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener cargue: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Actualizar un cargue
  update: async (id, cargueData) => {
    try {
      const response = await fetch(`${API_URL}/cargues/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cargueData),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar cargue: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Eliminar un cargue
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/cargues/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Error al eliminar cargue: ${response.status}`);
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obtener cargue por día y vendedor
  getByDiaVendedor: async (dia, vendedorId) => {
    try {
      // Mapear vendedor_id a database ID
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      const vendedorNumerico = vendedorMap[vendedorId] || 1;
      
      const params = { dia: dia.toUpperCase(), vendedor: vendedorNumerico };
      return await cargueService.getAll(params);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obtener cargue por día, vendedor y fecha específica
  getByDiaVendedorFecha: async (dia, vendedorId, fecha) => {
    try {
      // Mapear vendedor_id a database ID
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      const vendedorNumerico = vendedorMap[vendedorId] || 1;
      
      const params = { 
        dia: dia.toUpperCase(), 
        vendedor: vendedorNumerico,
        fecha: fecha // YYYY-MM-DD
      };
      return await cargueService.getAll(params);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Guardar cargue completo con productos
  guardarCargue: async (datosCompletos) => {
    try {
      // Mapear vendedor_id a database ID
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      
      // Crear el cargue operativo
      const cargueData = {
        dia: datosCompletos.dia_semana,
        fecha: datosCompletos.fecha,
        usuario: datosCompletos.responsable,
        vendedor: vendedorMap[datosCompletos.vendedor_id] || 1
      };
      
      const cargue = await cargueService.create(cargueData);
      
      if (cargue.error) {
        throw new Error(cargue.message);
      }
      
      // Guardar detalles de productos (solo los que tienen cantidad > 0)
      const productosConDatos = datosCompletos.productos.filter(p => p.cantidad > 0);
      
      for (const producto of productosConDatos) {
        // Buscar el producto por nombre para obtener su ID
        const productoResponse = await fetch(`${API_URL}/productos/?name=${encodeURIComponent(producto.producto_nombre)}`);
        const productos = await productoResponse.json();
        const productoId = productos.length > 0 ? productos[0].id : null;
        
        if (!productoId) {
          console.warn(`⚠️ Producto no encontrado: ${producto.producto_nombre}`);
          continue; // Saltar este producto si no se encuentra
        }

        const detalleData = {
          cargue_id: cargue.id,
          producto_id: productoId,
          vendedor_check: producto.vendedor || false,
          despachador_check: producto.despachador || false,
          cantidad: producto.cantidad || 0,
          dctos: producto.dctos || 0,
          adicional: producto.adicional || 0,
          devoluciones: producto.devoluciones || 0,
          vencidas: producto.vencidas || 0,
          total: producto.total || 0,
          valor: producto.valor || 0,
          neto: producto.neto || 0
        };
        
        // Los lotes vencidos se guardarán en una tabla separada si es necesario
        console.log(`💾 Guardando producto: ${producto.producto_nombre} (ID: ${productoId})`);
        if (producto.lotes_vencidos && producto.lotes_vencidos.length > 0) {
          console.log(`🗂️ Lotes vencidos para ${producto.producto_nombre}:`, producto.lotes_vencidos);
        }
        
        await detalleCargueService.create(detalleData);
      }
      
      return cargue;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Guardar datos de resumen (BASE CAJA, CONCEPTOS, etc.)
  guardarResumen: async (datosResumen) => {
    try {
      // Crear un cargue especial para datos de resumen
      const cargueData = {
        dia: datosResumen.dia_semana,
        fecha: datosResumen.fecha,
        usuario: datosResumen.responsable,
        vendedor: 7, // ID especial para datos de resumen
        observaciones: JSON.stringify(datosResumen.datos_adicionales)
      };
      
      const cargue = await cargueService.create(cargueData);
      
      if (cargue.error) {
        throw new Error(cargue.message);
      }
      
      return cargue;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Servicios para Detalles de Cargue
export const detalleCargueService = {
  // Obtener todos los detalles
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/detalle-cargues/?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener detalles: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Crear detalle
  create: async (detalleData) => {
    try {
      const response = await fetch(`${API_URL}/detalle-cargues/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detalleData),
      });

      if (!response.ok) throw new Error(`Error al crear detalle: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Actualizar detalle
  update: async (id, detalleData) => {
    try {
      const response = await fetch(`${API_URL}/detalle-cargues/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detalleData),
      });

      if (!response.ok) throw new Error(`Error al actualizar detalle: ${response.status}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};