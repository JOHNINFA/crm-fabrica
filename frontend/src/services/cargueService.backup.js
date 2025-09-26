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
      console.log('🚀 INICIANDO GUARDADO DE CARGUE:', datosCompletos);
      
      // ▼▼▼ LOG PARA DEBUGGEAR DATOS ENVIADOS AL BACKEND ▼▼▼
      console.log('🚀 ENVIANDO AL BACKEND (/api/cargues/):', JSON.stringify(datosCompletos, null, 2));
      
      // Mapear vendedor_id a database ID
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      
      // Crear el cargue operativo
      const cargueData = {
        dia: datosCompletos.dia_semana,
        fecha: datosCompletos.fecha,
        usuario: datosCompletos.responsable,
        vendedor_id: vendedorMap[datosCompletos.vendedor_id] || 1,
        estado: 'COMPLETADO',
        activo: true
      };
      
      console.log('📤 Enviando datos de cargue:', cargueData);
      const cargue = await cargueService.create(cargueData);
      
      console.log('📥 Respuesta del servidor:', cargue);
      
      if (cargue.error) {
        console.error('❌ Error en respuesta:', cargue);
        throw new Error(cargue.message);
      }
      
      console.log('✅ Cargue creado exitosamente con ID:', cargue.id);
      
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

  // ✨ NUEVA FUNCIÓN PARA EL ENDPOINT MEJORADO CON DATOS ANIDADOS ✨
  guardarCargueCompleto: async (datosParaGuardar) => {
    try {
      console.log('🚀 DATOS ORIGINALES RECIBIDOS:', JSON.stringify(datosParaGuardar, null, 2));
      
      // 🔄 TRANSFORMAR DATOS AL FORMATO QUE ESPERA EL BACKEND
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      
      const datosTransformados = {
        // Mapear campos del frontend al backend
        dia: datosParaGuardar.dia_semana,
        vendedor_id: datosParaGuardar.vendedor_id, // Mantener como string para el backend
        fecha: datosParaGuardar.fecha,
        usuario: datosParaGuardar.responsable || 'Sistema Web',
        estado: 'COMPLETADO', // ✅ Agregar campo estado requerido
        activo: true,
        
        // Transformar productos
        productos: datosParaGuardar.productos.map(p => ({
          producto_nombre: p.producto_nombre,
          cantidad: p.cantidad || 0,
          dctos: p.dctos || 0,
          adicional: p.adicional || 0,
          devoluciones: p.devoluciones || 0,
          vencidas: p.vencidas || 0,
          valor: p.valor || 0,
          vendedor_check: p.vendedor || false,
          despachador_check: p.despachador || false,
          lotes_vencidos: p.lotes_vencidos || []
        })),
        
        // Agregar arrays vacíos para pagos y resumen si no existen
        pagos: datosParaGuardar.pagos || [],
        resumen: datosParaGuardar.resumen || {}
      };
      
      console.log('🔄 DATOS TRANSFORMADOS PARA BACKEND:', JSON.stringify(datosTransformados, null, 2));
      
      const response = await fetch(`${API_URL}/cargues/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTransformados),
      });

      console.log('📡 Respuesta del servidor - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        console.error('❌ Datos que causaron el error:', JSON.stringify(datosTransformados, null, 2));
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const resultado = await response.json();
      console.log('✅ Respuesta exitosa del servidor:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error en guardarCargueCompleto:', error);
      return { error: true, message: error.message };
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