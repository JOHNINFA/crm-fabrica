// 🚀 SERVICIO ADAPTADO - MANTIENE LA MISMA INTERFAZ CON NUEVOS ENDPOINTS
// Migrado automáticamente para usar las nuevas tablas simplificadas

const API_URL = 'http://localhost:8000/api';

// Mapeo de IDs a endpoints nuevos
const ENDPOINT_MAP = {
  'ID1': 'cargue-id1',
  'ID2': 'cargue-id2', 
  'ID3': 'cargue-id3',
  'ID4': 'cargue-id4',
  'ID5': 'cargue-id5',
  'ID6': 'cargue-id6'
};

// Función para obtener el endpoint correcto según el vendedor_id
const getEndpointForVendedor = (vendedorId) => {
  return ENDPOINT_MAP[vendedorId] || 'cargue-id1';
};

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.error('❌ Error en API:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Cargues Operativos (INTERFAZ MANTENIDA)
export const cargueService = {
  // Obtener todos los cargues (ADAPTADO A NUEVOS ENDPOINTS)
  getAll: async (params = {}) => {
    try {
      // Si hay vendedor específico, usar su endpoint
      if (params.vendedor_id) {
        const endpoint = getEndpointForVendedor(params.vendedor_id);
        const queryParams = new URLSearchParams();
        
        // Mapear parámetros al nuevo formato
        if (params.dia) queryParams.append('dia', params.dia);
        if (params.fecha) queryParams.append('fecha', params.fecha);
        if (params.activo !== undefined) queryParams.append('activo', params.activo);
        
        const url = `${API_URL}/${endpoint}/?${queryParams.toString()}`;
        console.log('🔍 Consultando endpoint:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error al obtener cargues: ${response.status}`);
        
        return await response.json();
      }
      
      // Si no hay vendedor específico, consultar todos (para compatibilidad)
      const allResults = [];
      for (const vendedorId of Object.keys(ENDPOINT_MAP)) {
        try {
          const result = await cargueService.getAll({ ...params, vendedor_id: vendedorId });
          if (result && !result.error) {
            allResults.push(...(Array.isArray(result) ? result : [result]));
          }
        } catch (error) {
          console.warn(`⚠️ Error consultando ${vendedorId}:`, error);
        }
      }
      
      return allResults;
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

  // ✨ FUNCIÓN PRINCIPAL ADAPTADA A NUEVOS ENDPOINTS ✨
  guardarCargueCompleto: async (datosParaGuardar) => {
    try {
      console.log('🚀 GUARDANDO CARGUE COMPLETO (NUEVO SISTEMA):', JSON.stringify(datosParaGuardar, null, 2));
      
      const vendedorId = datosParaGuardar.vendedor_id;
      const endpoint = getEndpointForVendedor(vendedorId);
      
      console.log(`📍 Usando endpoint: ${endpoint} para vendedor: ${vendedorId}`);
      
      // Para cada producto, crear un registro separado (como tabla plana)
      const productos = datosParaGuardar.productos || [];
      const resultados = [];
      
      for (const producto of productos) {
        // Solo procesar productos con datos relevantes
        if (producto.cantidad > 0 || producto.devoluciones > 0 || producto.vencidas > 0) {
          const datosTransformados = {
            dia: datosParaGuardar.dia_semana,
            fecha: datosParaGuardar.fecha,
            usuario: datosParaGuardar.responsable || 'Sistema',
            responsable: datosParaGuardar.responsable || 'RESPONSABLE',  // ✅ Campo responsable agregado
            activo: true,
            
            // Datos del producto
            producto: producto.producto_nombre || '',
            cantidad: producto.cantidad || 0,
            dctos: producto.dctos || 0,
            adicional: producto.adicional || 0,
            devoluciones: producto.devoluciones || 0,
            vencidas: producto.vencidas || 0,
            valor: producto.valor || 0,
            v: producto.vendedor || false,
            d: producto.despachador || false,
            lotes_vencidos: JSON.stringify(producto.lotes_vencidos || []),
            
            // ✅ Datos de pagos (estructura corregida)
            ...(datosParaGuardar.pagos && {
              concepto: datosParaGuardar.pagos.concepto || '',
              descuentos: datosParaGuardar.pagos.descuentos || 0,
              nequi: datosParaGuardar.pagos.nequi || 0,
              daviplata: datosParaGuardar.pagos.daviplata || 0
            }),
            
            // ✅ Datos de resumen (estructura corregida)
            ...(datosParaGuardar.resumen && {
              base_caja: datosParaGuardar.resumen.base_caja || 0,
              total_despacho: datosParaGuardar.resumen.total_despacho || 0,
              total_pedidos: datosParaGuardar.resumen.total_pedidos || 0,
              total_dctos: datosParaGuardar.resumen.total_dctos || 0,
              venta: datosParaGuardar.resumen.venta || 0,
              total_efectivo: datosParaGuardar.resumen.total_efectivo || 0
            }),

            // ✅ Datos de cumplimiento (nuevo)
            ...(datosParaGuardar.cumplimiento && {
              licencia_transporte: datosParaGuardar.cumplimiento.licencia_transporte || null,
              soat: datosParaGuardar.cumplimiento.soat || null,
              uniforme: datosParaGuardar.cumplimiento.uniforme || null,
              no_locion: datosParaGuardar.cumplimiento.no_locion || null,
              no_accesorios: datosParaGuardar.cumplimiento.no_accesorios || null,
              capacitacion_carnet: datosParaGuardar.cumplimiento.capacitacion_carnet || null,
              higiene: datosParaGuardar.cumplimiento.higiene || null,
              estibas: datosParaGuardar.cumplimiento.estibas || null,
              desinfeccion: datosParaGuardar.cumplimiento.desinfeccion || null
            })
          };
          
          console.log(`💾 Guardando producto: ${producto.producto_nombre}`, datosTransformados);
          
          const response = await fetch(`${API_URL}/${endpoint}/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosTransformados),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error guardando ${producto.producto_nombre}:`, errorText);
            return { error: true, message: `Error guardando ${producto.producto_nombre}: ${errorText}` };
          }
          
          const resultado = await response.json();
          resultados.push(resultado);
          console.log(`✅ Producto guardado: ${producto.producto_nombre}`);
        }
      }
      
      console.log('🎉 Todos los productos guardados exitosamente:', resultados.length);
      return { success: true, resultados, count: resultados.length };
      
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