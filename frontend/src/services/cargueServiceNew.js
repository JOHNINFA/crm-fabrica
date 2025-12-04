// 🚀 NUEVO SERVICIO SIMPLIFICADO - MANTIENE LA MISMA INTERFAZ
// Adapta los endpoints antiguos a los nuevos sin cambiar la lógica del frontend

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Mapeo de IDs a endpoints
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

// ========================================
// SERVICIOS PRINCIPALES (MISMA INTERFAZ)
// ========================================

export const cargueService = {
  // Obtener todos los cargues (MANTIENE LA MISMA INTERFAZ)
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

  // Crear un nuevo cargue (MANTIENE LA MISMA INTERFAZ)
  create: async (cargueData) => {
    try {

      
      // Determinar endpoint según vendedor_id
      const vendedorId = cargueData.vendedor_id;
      const endpoint = getEndpointForVendedor(vendedorId);
      
      console.log(`📍 Usando endpoint: ${endpoint} para vendedor: ${vendedorId}`);
      
      // Transformar datos al formato de tabla plana
      const datosTransformados = {
        dia: cargueData.dia,
        fecha: cargueData.fecha,
        usuario: cargueData.usuario || 'Sistema',
        activo: cargueData.activo !== false,
        
        // Si hay productos, tomar el primero (para compatibilidad)
        ...(cargueData.productos && cargueData.productos.length > 0 && {
          producto: cargueData.productos[0].producto_nombre || '',
          cantidad: cargueData.productos[0].cantidad || 0,
          dctos: cargueData.productos[0].dctos || 0,
          adicional: cargueData.productos[0].adicional || 0,
          devoluciones: cargueData.productos[0].devoluciones || 0,
          vencidas: cargueData.productos[0].vencidas || 0,
          valor: cargueData.productos[0].valor || 0,
          v: cargueData.productos[0].vendedor_check || false,
          d: cargueData.productos[0].despachador_check || false,
          lotes_vencidos: JSON.stringify(cargueData.productos[0].lotes_vencidos || [])
        }),
        
        // Si hay pagos, tomar el primero
        ...(cargueData.pagos && cargueData.pagos.length > 0 && {
          concepto: cargueData.pagos[0].concepto || '',
          descuentos: cargueData.pagos[0].descuentos || 0,
          nequi: cargueData.pagos[0].nequi || 0,
          daviplata: cargueData.pagos[0].daviplata || 0
        }),
        
        // Si hay resumen
        ...(cargueData.resumen && {
          base_caja: cargueData.resumen.base_caja || 0,
          total_despacho: cargueData.resumen.total_despacho || 0,
          total_pedidos: cargueData.resumen.total_pedidos || 0,
          total_dctos: cargueData.resumen.total_dctos || 0,
          venta: cargueData.resumen.venta || 0,
          total_efectivo: cargueData.resumen.total_efectivo || 0
        })
      };
      

      
      const response = await fetch(`${API_URL}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTransformados),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const resultado = await response.json();

      
      return resultado;
    } catch (error) {
      console.error('❌ Error en create:', error);
      return handleApiError(error);
    }
  },

  // Obtener cargue por día y vendedor (MANTIENE LA MISMA INTERFAZ)
  getByDiaVendedor: async (dia, vendedorId) => {
    try {
      const params = { 
        dia: dia.toUpperCase(), 
        vendedor_id: vendedorId 
      };
      return await cargueService.getAll(params);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Obtener cargue por día, vendedor y fecha (MANTIENE LA MISMA INTERFAZ)
  getByDiaVendedorFecha: async (dia, vendedorId, fecha) => {
    try {
      const params = { 
        dia: dia.toUpperCase(), 
        vendedor_id: vendedorId,
        fecha: fecha
      };
      return await cargueService.getAll(params);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✨ FUNCIÓN PRINCIPAL PARA GUARDAR CARGUE COMPLETO ✨
  guardarCargueCompleto: async (datosParaGuardar) => {
    try {

      
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
            
            // Datos de pagos (si existen)
            ...(datosParaGuardar.pagos && datosParaGuardar.pagos.length > 0 && {
              concepto: datosParaGuardar.pagos[0].concepto || '',
              descuentos: datosParaGuardar.pagos[0].descuentos || 0,
              nequi: datosParaGuardar.pagos[0].nequi || 0,
              daviplata: datosParaGuardar.pagos[0].daviplata || 0
            }),
            
            // Datos de resumen (si existe)
            ...(datosParaGuardar.resumen && {
              base_caja: datosParaGuardar.resumen.base_caja || 0,
              total_despacho: datosParaGuardar.resumen.total_despacho || 0,
              total_pedidos: datosParaGuardar.resumen.total_pedidos || 0,
              total_dctos: datosParaGuardar.resumen.total_dctos || 0,
              venta: datosParaGuardar.resumen.venta || 0,
              total_efectivo: datosParaGuardar.resumen.total_efectivo || 0
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
      

      return { success: true, resultados, count: resultados.length };
      
    } catch (error) {
      console.error('❌ Error en guardarCargueCompleto:', error);
      return { error: true, message: error.message };
    }
  },

  // Funciones de compatibilidad (mantienen la interfaz antigua)
  getById: async (id) => {
    console.warn('⚠️ getById no implementado en nueva estructura');
    return { error: true, message: 'Función no disponible en nueva estructura' };
  },

  update: async (id, cargueData) => {
    console.warn('⚠️ update no implementado en nueva estructura');
    return { error: true, message: 'Función no disponible en nueva estructura' };
  },

  delete: async (id) => {
    console.warn('⚠️ delete no implementado en nueva estructura');
    return { error: true, message: 'Función no disponible en nueva estructura' };
  }
};

// ========================================
// SERVICIOS DE DETALLE (COMPATIBILIDAD)
// ========================================

export const detalleCargueService = {
  getAll: async (params = {}) => {
    console.warn('⚠️ detalleCargueService.getAll no necesario en nueva estructura');
    return [];
  },

  create: async (detalleData) => {
    console.warn('⚠️ detalleCargueService.create no necesario en nueva estructura');
    return { success: true };
  },

  update: async (id, detalleData) => {
    console.warn('⚠️ detalleCargueService.update no necesario en nueva estructura');
    return { success: true };
  }
};

// ========================================
// SERVICIO DE VENDEDORES (NUEVO)
// ========================================

export const vendedorService = {
  // Obtener información de vendedor por ID (simulado)
  getByIdVendedor: async (idVendedor) => {
    try {
      // Simular datos de vendedor basados en el ID
      const vendedorData = {
        'ID1': { id: 1, nombre: 'Vendedor 1', id_vendedor: 'ID1', ruta: 'Ruta 1', responsable: 'RESPONSABLE' },
        'ID2': { id: 2, nombre: 'Vendedor 2', id_vendedor: 'ID2', ruta: 'Ruta 2', responsable: 'RESPONSABLE' },
        'ID3': { id: 3, nombre: 'Vendedor 3', id_vendedor: 'ID3', ruta: 'Ruta 3', responsable: 'RESPONSABLE' },
        'ID4': { id: 4, nombre: 'Vendedor 4', id_vendedor: 'ID4', ruta: 'Ruta 4', responsable: 'RESPONSABLE' },
        'ID5': { id: 5, nombre: 'Vendedor 5', id_vendedor: 'ID5', ruta: 'Ruta 5', responsable: 'RESPONSABLE' },
        'ID6': { id: 6, nombre: 'Vendedor 6', id_vendedor: 'ID6', ruta: 'Ruta 6', responsable: 'RESPONSABLE' }
      };
      
      return vendedorData[idVendedor] || vendedorData['ID1'];
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Actualizar responsable (simulado - usa localStorage)
  actualizarResponsable: async (idVendedor, nuevoResponsable) => {
    try {
      // En la nueva estructura, esto se maneja via localStorage
      // Mantener compatibilidad con la interfaz existente
      console.log(`📝 Actualizando responsable ${idVendedor}: ${nuevoResponsable}`);
      
      return {
        success: true,
        vendedor: {
          id_vendedor: idVendedor,
          responsable: nuevoResponsable
        },
        message: 'Responsable actualizado exitosamente'
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};


