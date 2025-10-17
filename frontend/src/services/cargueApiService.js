// Servicio de integración con API para el módulo Cargue
// NOTA: Este servicio está preparado pero NO ACTIVO todavía
// Se activará cuando se complete la integración con React Native

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ===== SERVICIO PRINCIPAL DE CARGUE API =====
export const cargueApiService = {
  
  // 🚀 CARGAR DATOS DESDE SERVIDOR (React Native → Django → React Web)
  cargarDatosDesdeServidor: async (dia, idSheet, fecha) => {
    try {
      console.log(`🔍 API: Cargando datos desde servidor - ${dia} ${idSheet} ${fecha}`);
      
      // Mapear ID de vendedor a número de base de datos
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      const vendedorNumerico = vendedorMap[idSheet] || 1;
      
      // Buscar cargue existente
      const params = new URLSearchParams({
        dia: dia.toUpperCase(),
        vendedor: vendedorNumerico,
        fecha: fecha
      });
      
      const response = await fetch(`${API_BASE_URL}/cargues/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const cargue = data.results[0];
        
        // Obtener detalles de productos
        const detallesResponse = await fetch(`${API_BASE_URL}/detalle-cargues/?cargue_operativo=${cargue.id}`);
        const detallesData = await detallesResponse.json();
        
        // Formatear datos para el frontend
        const productosFormateados = detallesData.results.map(detalle => ({
          id: detalle.producto_id || Math.random(), // Temporal hasta tener producto_id
          producto: detalle.producto_nombre,
          cantidad: detalle.cantidad || 0,
          dctos: detalle.dctos || 0,
          adicional: detalle.adicional || 0,
          devoluciones: detalle.devoluciones || 0,
          vencidas: detalle.vencidas || 0,
          total: detalle.total || 0,
          valor: detalle.valor || 1625,
          neto: detalle.neto || 0,
          vendedor: detalle.vendedor_check || false,
          despachador: detalle.despachador_check || false,
          lotesVencidos: [] // Se cargarán por separado
        }));
        
        // Cargar lotes vencidos para cada producto
        for (const producto of productosFormateados) {
          const lotesResponse = await fetch(`${API_BASE_URL}/lotes-vencidos/?detalle_cargue=${producto.detalle_id}`);
          if (lotesResponse.ok) {
            const lotesData = await lotesResponse.json();
            producto.lotesVencidos = lotesData.results.map(lote => ({
              lote: lote.lote,
              motivo: lote.motivo
            }));
          }
        }
        
        console.log(`✅ API: Datos cargados - ${productosFormateados.length} productos`);
        
        return {
          success: true,
          data: {
            dia,
            idSheet,
            fecha,
            productos: productosFormateados,
            timestamp: Date.now(),
            sincronizado: true,
            fromServer: true
          }
        };
      } else {
        console.log(`⚠️ API: No hay datos en servidor para ${dia} ${idSheet} ${fecha}`);
        return {
          success: false,
          message: 'No hay datos en el servidor',
          data: null
        };
      }
      
    } catch (error) {
      console.error('❌ API: Error cargando datos desde servidor:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  },

  // 🚀 SINCRONIZAR DATOS AL SERVIDOR (React Web → Django)
  sincronizarDatosAlServidor: async (dia, idSheet, fecha, productos) => {
    try {
      console.log(`📤 API: Sincronizando datos al servidor - ${dia} ${idSheet} ${fecha}`);
      
      const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
      };
      const vendedorNumerico = vendedorMap[idSheet] || 1;
      
      // 1. Crear o actualizar CargueOperativo
      const cargueData = {
        dia: dia.toUpperCase(),
        fecha: fecha,
        usuario: 'Sistema Web',
        vendedor: vendedorNumerico
      };
      
      let cargueId;
      
      // Buscar si ya existe
      const existingResponse = await fetch(`${API_BASE_URL}/cargues/?dia=${dia.toUpperCase()}&vendedor=${vendedorNumerico}&fecha=${fecha}`);
      const existingData = await existingResponse.json();
      
      if (existingData.results && existingData.results.length > 0) {
        // Actualizar existente
        cargueId = existingData.results[0].id;
        await fetch(`${API_BASE_URL}/cargues/${cargueId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cargueData)
        });
      } else {
        // Crear nuevo
        const createResponse = await fetch(`${API_BASE_URL}/cargues/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cargueData)
        });
        const createData = await createResponse.json();
        cargueId = createData.id;
      }
      
      // 2. Sincronizar productos (solo los que tienen datos)
      const productosConDatos = productos.filter(p => 
        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 || 
        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
      );
      
      for (const producto of productosConDatos) {
        const detalleData = {
          cargue_operativo: cargueId,
          producto_nombre: producto.producto,
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
        
        // Crear o actualizar detalle
        const detalleResponse = await fetch(`${API_BASE_URL}/detalle-cargues/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detalleData)
        });
        
        const detalleResult = await detalleResponse.json();
        
        // 3. Sincronizar lotes vencidos si existen
        if (producto.lotesVencidos && producto.lotesVencidos.length > 0) {
          for (const lote of producto.lotesVencidos) {
            await fetch(`${API_BASE_URL}/lotes-vencidos/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                detalle_cargue: detalleResult.id,
                lote: lote.lote,
                motivo: lote.motivo,
                usuario: 'Sistema Web'
              })
            });
          }
        }
      }
      
      console.log(`✅ API: Datos sincronizados - ${productosConDatos.length} productos`);
      
      return {
        success: true,
        message: `Sincronizados ${productosConDatos.length} productos`,
        cargueId: cargueId
      };
      
    } catch (error) {
      console.error('❌ API: Error sincronizando datos al servidor:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // 🚀 CARGAR DATOS DE CUMPLIMIENTO
  cargarCumplimientoDesdeServidor: async (dia, idSheet, fecha) => {
    try {
      const params = new URLSearchParams({
        dia: dia.toUpperCase(),
        id_sheet: idSheet,
        fecha: fecha
      });
      
      const response = await fetch(`${API_BASE_URL}/control-cumplimiento/?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const registro = data.results[0];
          
          // Extraer solo los campos de cumplimiento
          const cumplimiento = {};
          const campos = [
            'licencia_transporte', 'soat', 'uniforme', 'no_locion', 
            'no_accesorios', 'capacitacion_carnet', 'higiene', 'estibas', 'desinfeccion'
          ];
          
          campos.forEach(campo => {
            if (registro[campo] !== null) {
              cumplimiento[campo] = registro[campo];
            }
          });
          
          return {
            success: true,
            data: cumplimiento
          };
        }
      }
      
      return {
        success: false,
        message: 'No hay datos de cumplimiento en el servidor'
      };
      
    } catch (error) {
      console.error('❌ API: Error cargando cumplimiento:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // 🚀 VERIFICAR CONEXIÓN CON EL SERVIDOR
  verificarConexion: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/`, {
        method: 'HEAD' // Solo verificar que responda
      });
      
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Servidor disponible' : 'Servidor no disponible'
      };
      
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: 'No se puede conectar al servidor'
      };
    }
  }
};

// ===== SERVICIO DE INTEGRACIÓN HÍBRIDA =====
export const cargueHybridService = {
  
  // 🚀 CARGAR DATOS (localStorage primero, servidor como fallback)
  cargarDatos: async (dia, idSheet, fecha) => {
    console.log(`🔍 HYBRID: Cargando datos - ${dia} ${idSheet} ${fecha}`);
    
    // 1. Intentar cargar desde localStorage primero
    const key = `cargue_${dia}_${idSheet}_${fecha}`;
    const datosLocal = localStorage.getItem(key);
    
    if (datosLocal) {
      try {
        const datos = JSON.parse(datosLocal);
        console.log(`✅ HYBRID: Datos encontrados en localStorage`);
        return {
          success: true,
          data: datos,
          source: 'localStorage'
        };
      } catch (error) {
        console.error('❌ HYBRID: Error parsing localStorage:', error);
      }
    }
    
    // 2. Si no hay datos locales, intentar cargar desde servidor
    console.log(`🔍 HYBRID: No hay datos locales, consultando servidor...`);
    const resultadoServidor = await cargueApiService.cargarDatosDesdeServidor(dia, idSheet, fecha);
    
    if (resultadoServidor.success) {
      // Guardar en localStorage para próxima vez
      localStorage.setItem(key, JSON.stringify(resultadoServidor.data));
      console.log(`✅ HYBRID: Datos cargados desde servidor y guardados localmente`);
      
      return {
        success: true,
        data: resultadoServidor.data,
        source: 'servidor'
      };
    }
    
    // 3. Si no hay datos en ningún lado, retornar estructura vacía
    console.log(`⚠️ HYBRID: No hay datos disponibles, usando estructura vacía`);
    return {
      success: false,
      message: 'No hay datos disponibles',
      source: 'ninguno'
    };
  },

  // 🚀 GUARDAR DATOS (localStorage inmediato, servidor con debounce)
  guardarDatos: async (dia, idSheet, fecha, productos) => {
    const key = `cargue_${dia}_${idSheet}_${fecha}`;
    
    // Obtener responsable desde localStorage
    const datosExistentes = localStorage.getItem(key);
    let responsable = 'RESPONSABLE';
    if (datosExistentes) {
      try {
        const parsed = JSON.parse(datosExistentes);
        responsable = parsed.responsable || 'RESPONSABLE';
      } catch (e) {}
    }
    
    // 1. Guardar inmediatamente en localStorage
    const datos = {
      dia,
      idSheet,
      fecha,
      responsable,
      productos,
      timestamp: Date.now(),
      sincronizado: false
    };
    
    localStorage.setItem(key, JSON.stringify(datos));
    console.log(`💾 HYBRID: Datos guardados en localStorage`);
    
    // 2. Programar sincronización con servidor (debounce de 3 segundos)
    const timeoutKey = `cargueApiTimeout_${idSheet}_${dia}_${fecha}`;
    if (window[timeoutKey]) {
      clearTimeout(window[timeoutKey]);
    }
    
    window[timeoutKey] = setTimeout(async () => {
      console.log(`📤 HYBRID: Iniciando sincronización con servidor para ${idSheet}...`);
      
      // Usar el servicio de cargue para guardar en las tablas api_cargueidX
      const { cargueService } = await import('./cargueService');
      
      const datosParaGuardar = {
        dia_semana: dia.toUpperCase(),
        fecha: fecha,
        vendedor_id: idSheet,
        responsable: responsable,
        productos: productos.map(p => ({
          producto_nombre: p.producto,
          cantidad: p.cantidad || 0,
          dctos: p.dctos || 0,
          adicional: p.adicional || 0,
          devoluciones: p.devoluciones || 0,
          vencidas: p.vencidas || 0,
          valor: p.valor || 0,
          vendedor: p.vendedor || false,
          despachador: p.despachador || false,
          lotes_vencidos: p.lotesVencidos || []
        }))
      };
      
      const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);
      
      if (resultado.success) {
        datos.sincronizado = true;
        localStorage.setItem(key, JSON.stringify(datos));
        console.log(`✅ HYBRID: Datos sincronizados con servidor (${resultado.count} productos)`);
      } else {
        console.error(`❌ HYBRID: Error sincronizando con servidor:`, resultado.message);
      }
    }, 3000);
    
    return {
      success: true,
      message: 'Datos guardados localmente, sincronización programada'
    };
  }
};

// ===== CONFIGURACIÓN DE ACTIVACIÓN =====
export const cargueApiConfig = {
  // 🚀 ACTIVAR/DESACTIVAR INTEGRACIÓN CON API
  USAR_API: true, // ✅ ACTIVADO - Sincronización automática con debounce
  
  // 🚀 CONFIGURACIÓN DE TIMEOUTS
  TIMEOUT_CONEXION: 5000, // 5 segundos
  DEBOUNCE_SINCRONIZACION: 3000, // 3 segundos
  
  // 🚀 CONFIGURACIÓN DE REINTENTOS
  MAX_REINTENTOS: 3,
  INTERVALO_REINTENTO: 1000, // 1 segundo
  
  // 🚀 LOGS DE DEBUG
  DEBUG_LOGS: true,
  
  // 🚀 FUNCIÓN PARA ACTIVAR LA INTEGRACIÓN
  activarIntegracion: () => {
    cargueApiConfig.USAR_API = true;
    console.log('🚀 API CARGUE: Integración ACTIVADA');
    console.log('   - Los datos ahora se cargarán desde el servidor');
    console.log('   - La sincronización será automática');
    console.log('   - localStorage seguirá siendo el cache local');
  },
  
  // 🚀 FUNCIÓN PARA DESACTIVAR LA INTEGRACIÓN
  desactivarIntegracion: () => {
    cargueApiConfig.USAR_API = false;
    console.log('⚠️ API CARGUE: Integración DESACTIVADA');
    console.log('   - Los datos se manejarán solo con localStorage');
    console.log('   - No habrá sincronización con servidor');
  }
};

// ===== EXPORTACIÓN PRINCIPAL =====
export default {
  api: cargueApiService,
  hybrid: cargueHybridService,
  config: cargueApiConfig
};