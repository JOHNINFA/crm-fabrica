// Servicio de integración con API para el módulo Cargue
// NOTA: Este servicio está preparado pero NO ACTIVO todavía
// Se activará cuando se complete la integración con React Native

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// ===== SERVICIO PRINCIPAL DE CARGUE API =====
export const cargueApiService = {

  // 🚀 CARGAR DATOS DESDE SERVIDOR (React Native → Django → React Web)
  cargarDatosDesdeServidor: async (dia, idSheet, fecha) => {
    try {
      console.log(`🔍 API: Cargando datos desde servidor - ${dia} ${idSheet} ${fecha}`);

      // Usar el endpoint que recibe datos de la app móvil
      const params = new URLSearchParams({
        vendedor_id: idSheet, // ID1, ID2, etc.
        dia: dia.toUpperCase(),
        fecha: fecha
      });

      const response = await fetch(`${API_BASE_URL}/obtener-cargue/?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      console.log(`🔍 API: Respuesta del servidor:`, data);
      console.log(`🔍 API: Cantidad de productos:`, Object.keys(data).length);

      // El endpoint devuelve: { "AREPA TIPO OBLEA 500Gr": { quantity: "10", checked: false }, ... }
      if (data && Object.keys(data).length > 0) {
        // Convertir el formato del backend al formato del frontend
        const productosFormateados = Object.entries(data).map(([nombreProducto, datos]) => {
          console.log(`🔍 API: Formateando producto: ${nombreProducto}`, {
            cantidad: datos.cantidad,
            adicional: datos.adicional,
            dctos: datos.dctos,
            devoluciones: datos.devoluciones,
            vencidas: datos.vencidas,
            total: datos.total || datos.quantity
          });

          // Parsear lotes_vencidos si es string JSON
          let lotesVencidos = [];
          if (datos.lotes_vencidos) {
            try {
              lotesVencidos = typeof datos.lotes_vencidos === 'string'
                ? JSON.parse(datos.lotes_vencidos)
                : datos.lotes_vencidos;
            } catch (e) {
              console.error('Error parsing lotes_vencidos:', e);
            }
          }

          return {
            id: Math.random(), // Temporal, se reemplazará con el ID real del producto
            producto: nombreProducto,
            cantidad: parseInt(datos.cantidad) || 0,
            dctos: parseInt(datos.dctos) || 0,
            adicional: parseInt(datos.adicional) || 0,
            devoluciones: parseInt(datos.devoluciones) || 0,  // ✅ Ahora usa el valor real
            vencidas: parseInt(datos.vencidas) || 0,  // ✅ Ahora usa el valor real
            vendidas: parseInt(datos.vendidas) || 0,  // ✅ Vendidas
            total: parseInt(datos.total) || parseInt(datos.quantity) || 0,
            valor: parseFloat(datos.valor) || 0,
            neto: parseFloat(datos.neto) || 0,
            vendedor: datos.v || false,
            despachador: datos.d || false,
            lotesVencidos: lotesVencidos,  // ✅ Lotes vencidos
            // Campos globales (se toman del primer producto)
            nequi: parseFloat(datos.nequi) || 0,
            daviplata: parseFloat(datos.daviplata) || 0,
            concepto: datos.concepto || '',
            descuentos: parseFloat(datos.descuentos) || 0,
            base_caja: parseFloat(datos.base_caja) || 0,
            // Cumplimiento
            licencia_transporte: datos.licencia_transporte || '',
            soat: datos.soat || '',
            uniforme: datos.uniforme || '',
            no_locion: datos.no_locion || '',
            no_accesorios: datos.no_accesorios || '',
            capacitacion_carnet: datos.capacitacion_carnet || '',
            higiene: datos.higiene || '',
            estibas: datos.estibas || '',
            desinfeccion: datos.desinfeccion || '',
          };
        });

        console.log(`✅ API: Datos cargados desde app móvil - ${productosFormateados.length} productos`);
        console.log(`🔍 API: Productos formateados:`, productosFormateados);

        return {
          success: true,
          data: {
            dia,
            idSheet,
            fecha,
            productos: productosFormateados,
            timestamp: Date.now(),
            sincronizado: true,
            fromServer: true,
            fromMobileApp: true // Indicador de que vienen de la app móvil
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

// ===== FUNCIÓN AUXILIAR: Extraer y guardar datos globales =====
const extraerYGuardarDatosGlobales = (dia, idSheet, fecha, productos) => {
  if (!productos || productos.length === 0) return;

  // Buscar el primer producto que tenga datos de pagos o cumplimiento
  const productoConDatosGlobales = productos.find(p =>
    p.nequi > 0 || p.daviplata > 0 || p.concepto || p.descuentos > 0 ||
    p.licencia_transporte || p.soat || p.uniforme
  ) || productos[0];

  if (!productoConDatosGlobales) return;

  console.log(`🔍 GLOBAL: Extrayendo datos globales de ${productoConDatosGlobales.producto}`);

  // 1. Guardar datos de PAGOS (conceptos)
  const conceptosKey = `conceptos_pagos_${dia}_${idSheet}_${fecha}`;
  const datosConceptosExistentes = localStorage.getItem(conceptosKey);

  // Solo guardar si no existen datos locales O si los datos del servidor tienen valores
  if (!datosConceptosExistentes || productoConDatosGlobales.nequi > 0 || productoConDatosGlobales.daviplata > 0) {
    const conceptoPago = {
      concepto: productoConDatosGlobales.concepto || '',
      descuentos: productoConDatosGlobales.descuentos || 0,
      nequi: productoConDatosGlobales.nequi || 0,
      daviplata: productoConDatosGlobales.daviplata || 0
    };

    if (conceptoPago.nequi > 0 || conceptoPago.daviplata > 0 || conceptoPago.concepto) {
      localStorage.setItem(conceptosKey, JSON.stringify([conceptoPago]));
      console.log(`💾 GLOBAL: Pagos guardados en localStorage:`, conceptoPago);
    }
  }

  // 2. Guardar BASE CAJA
  const baseCajaKey = `base_caja_${dia}_${idSheet}_${fecha}`;
  if (productoConDatosGlobales.base_caja > 0) {
    localStorage.setItem(baseCajaKey, productoConDatosGlobales.base_caja.toString());
    console.log(`💾 GLOBAL: Base caja guardada: ${productoConDatosGlobales.base_caja}`);
  }

  // 3. Guardar datos de CUMPLIMIENTO
  const cumplimientoKey = `cumplimiento_${dia}_${idSheet}_${fecha}`;
  const datosCumplimientoExistentes = localStorage.getItem(cumplimientoKey);

  // Solo guardar si no existen datos locales O si los datos del servidor tienen valores
  const tieneCumplimiento = productoConDatosGlobales.licencia_transporte ||
    productoConDatosGlobales.soat ||
    productoConDatosGlobales.uniforme;

  if (!datosCumplimientoExistentes || tieneCumplimiento) {
    const cumplimiento = {
      licencia_transporte: productoConDatosGlobales.licencia_transporte || '',
      soat: productoConDatosGlobales.soat || '',
      uniforme: productoConDatosGlobales.uniforme || '',
      no_locion: productoConDatosGlobales.no_locion || '',
      no_accesorios: productoConDatosGlobales.no_accesorios || '',
      capacitacion_carnet: productoConDatosGlobales.capacitacion_carnet || '',
      higiene: productoConDatosGlobales.higiene || '',
      estibas: productoConDatosGlobales.estibas || '',
      desinfeccion: productoConDatosGlobales.desinfeccion || ''
    };

    if (tieneCumplimiento) {
      localStorage.setItem(cumplimientoKey, JSON.stringify(cumplimiento));
      console.log(`💾 GLOBAL: Cumplimiento guardado:`, cumplimiento);
    }
  }
};

// ===== SERVICIO DE INTEGRACIÓN HÍBRIDA =====
export const cargueHybridService = {

  // 🚀 CARGAR DATOS (localStorage PRIMERO, merge inteligente con datos del servidor)
  cargarDatos: async (dia, idSheet, fecha) => {
    console.log(`🔍 HYBRID: Cargando datos - ${dia} ${idSheet} ${fecha}`);

    const key = `cargue_${dia}_${idSheet}_${fecha}`;
    const datosLocal = localStorage.getItem(key);

    // 1. Intentar cargar datos locales existentes
    let datosLocalesParsed = null;
    if (datosLocal) {
      try {
        datosLocalesParsed = JSON.parse(datosLocal);
        console.log(`✅ HYBRID: Datos locales encontrados (${datosLocalesParsed.productos?.length || 0} productos)`);
      } catch (error) {
        console.error('❌ HYBRID: Error parsing localStorage:', error);
      }
    }

    // 2. Consultar servidor para datos nuevos de la app móvil (si API está activa)
    if (cargueApiConfig.USAR_API) {
      console.log(`🔍 HYBRID: Consultando servidor para datos de app móvil...`);
      const resultadoServidor = await cargueApiService.cargarDatosDesdeServidor(dia, idSheet, fecha);

      if (resultadoServidor.success && resultadoServidor.data.fromMobileApp) {
        console.log(`📱 HYBRID: Datos recibidos desde app móvil`);

        // 3. MERGE INTELIGENTE: Combinar datos de app móvil con datos locales
        if (datosLocalesParsed && datosLocalesParsed.productos) {
          console.log(`🔄 HYBRID: Haciendo merge de datos app móvil + datos locales`);

          const productosMergeados = resultadoServidor.data.productos.map(productoApp => {
            // Buscar si este producto ya existe en datos locales
            const productoLocal = datosLocalesParsed.productos.find(
              p => p.producto === productoApp.producto
            );

            if (productoLocal) {
              // MERGE INTELIGENTE:
              // - De la app: cantidad, adicional, dctos, checks V/D (solo si la app los envió con valores)
              // - Del CRM: devoluciones, vencidas, lotes (NUNCA vienen de la app)
              // - Prioridad: Si el CRM tiene un valor mayor en adicional/dctos, preservarlo

              const cantidadFinal = productoApp.cantidad || productoLocal.cantidad || 0;
              const adicionalFinal = Math.max(productoApp.adicional || 0, productoLocal.adicional || 0); // Tomar el mayor
              const dctosFinal = Math.max(productoApp.dctos || 0, productoLocal.dctos || 0); // Tomar el mayor

              console.log(`🔄 Merge: ${productoApp.producto}`, {
                app: { cantidad: productoApp.cantidad, adicional: productoApp.adicional, dctos: productoApp.dctos, v: productoApp.vendedor },
                local: { cantidad: productoLocal.cantidad, adicional: productoLocal.adicional, dctos: productoLocal.dctos, devoluciones: productoLocal.devoluciones, vencidas: productoLocal.vencidas },
                final: { cantidad: cantidadFinal, adicional: adicionalFinal, dctos: dctosFinal }
              });

              // 🆕 RECALCULAR TOTAL después del merge
              const devoluciones = productoLocal.devoluciones || 0;
              const vencidas = productoLocal.vencidas || 0;
              const totalRecalculado = cantidadFinal - dctosFinal + adicionalFinal - devoluciones - vencidas;
              const netoRecalculado = Math.round(totalRecalculado * (productoLocal.valor || productoApp.valor || 0));

              return {
                ...productoApp,
                id: productoLocal.id, // Preservar ID local
                cantidad: cantidadFinal,
                adicional: adicionalFinal,
                dctos: dctosFinal,
                devoluciones: devoluciones,
                vencidas: vencidas,
                lotesVencidos: productoLocal.lotesVencidos || [],
                valor: productoLocal.valor || productoApp.valor,
                total: totalRecalculado,  // 🆕 Total recalculado
                neto: netoRecalculado     // 🆕 Neto recalculado
              };
            }

            // Si no existe localmente, usar datos de la app tal cual
            // 🆕 FIX CRÍTICO: Recalcular total y neto incluso para productos nuevos de la App
            const cantidad = productoApp.cantidad || 0;
            const dctos = productoApp.dctos || 0;
            const adicional = productoApp.adicional || 0;
            const devoluciones = productoApp.devoluciones || 0;
            const vencidas = productoApp.vencidas || 0;
            const valor = productoApp.valor || 0;

            const totalRecalculado = cantidad - dctos + adicional - devoluciones - vencidas;
            const netoRecalculado = Math.round(totalRecalculado * valor);

            return {
              ...productoApp,
              total: totalRecalculado,
              neto: netoRecalculado
            };
          });

          const datosMergeados = {
            ...resultadoServidor.data,
            productos: productosMergeados,
            responsable: datosLocalesParsed.responsable || resultadoServidor.data.responsable
          };

          localStorage.setItem(key, JSON.stringify(datosMergeados));
          console.log(`✅ HYBRID: Merge completado y guardado - ${productosMergeados.length} productos`);

          // 🆕 Extraer y guardar datos globales (pagos, cumplimiento)
          extraerYGuardarDatosGlobales(dia, idSheet, fecha, productosMergeados);

          return {
            success: true,
            data: datosMergeados,
            source: 'merge_app_local'
          };
        } else {
          // No hay datos locales, usar datos de app tal cual
          localStorage.setItem(key, JSON.stringify(resultadoServidor.data));
          console.log(`✅ HYBRID: Datos de app móvil guardados (sin merge)`);

          // 🆕 Extraer y guardar datos globales (pagos, cumplimiento)
          extraerYGuardarDatosGlobales(dia, idSheet, fecha, resultadoServidor.data.productos);

          return {
            success: true,
            data: resultadoServidor.data,
            source: 'app_movil'
          };
        }
      }
    } else {
      console.log(`⚠️ HYBRID: API desactivada, saltando consulta al servidor`);
    }

    // 4. Si no hay datos del servidor, usar datos locales si existen
    if (datosLocalesParsed) {
      console.log(`✅ HYBRID: Usando datos locales (sin datos nuevos del servidor)`);
      return {
        success: true,
        data: datosLocalesParsed,
        source: 'localStorage'
      };
    }

    // 5. Si no hay datos en ningún lado, retornar estructura vacía
    console.log(`⚠️ HYBRID: No hay datos disponibles`);
    return {
      success: false,
      message: 'No hay datos disponibles',
      source: 'ninguno'
    };
  },

  // 🚀 GUARDAR DATOS (localStorage inmediato, servidor con debounce)
  // 🚩 NUEVO: sincronizarServidor = true por defecto, false para evitar crear registros fantasma
  guardarDatos: async (dia, idSheet, fecha, productos, sincronizarServidor = true) => {
    const key = `cargue_${dia}_${idSheet}_${fecha}`;

    // Obtener responsable desde localStorage
    const datosExistentes = localStorage.getItem(key);
    let responsable = 'RESPONSABLE';
    if (datosExistentes) {
      try {
        const parsed = JSON.parse(datosExistentes);
        responsable = parsed.responsable || 'RESPONSABLE';
      } catch (e) { }
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

    // 🚩 NUEVO: Si sincronizarServidor es false, solo guardar en localStorage
    if (!sincronizarServidor) {
      console.log(`⏭️ HYBRID: Sincronización al servidor deshabilitada (carga inicial)`);
      return {
        success: true,
        message: 'Datos guardados solo en localStorage (sin sincronización)'
      };
    }

    // 2. Programar sincronización con servidor (debounce de 3 segundos)
    const timeoutKey = `cargueApiTimeout_${idSheet}_${dia}_${fecha}`;
    if (window[timeoutKey]) {
      clearTimeout(window[timeoutKey]);
    }

    window[timeoutKey] = setTimeout(async () => {
      if (!cargueApiConfig.USAR_API) {
        console.log(`⚠️ HYBRID: API desactivada, saltando sincronización`);
        return;
      }

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

      // 🔍 DEBUG: Ver valores antes de enviar

      productos.forEach(p => {
        if (p.cantidad > 0 || p.adicional > 0 || p.dctos > 0) {
          console.log(`   ${p.producto}: cantidad=${p.cantidad}, adicional=${p.adicional}, dctos=${p.dctos}, total=${p.total}`);
        }
      });

      const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

      if (resultado.success) {
        datos.sincronizado = true;
        localStorage.setItem(key, JSON.stringify(datos));
        console.log(`✅ HYBRID: Datos sincronizados con servidor (${resultado.count} productos)`);
      } else {
        console.error(`❌ HYBRID: Error sincronizando con servidor:`, resultado.message);
      }
    }, cargueApiConfig.DEBOUNCE_SINCRONIZACION); // Usar configuración de debounce

    return {
      success: true,
      message: 'Datos guardados localmente, sincronización programada'
    };
  }
};

// ===== CONFIGURACIÓN DE ACTIVACIÓN =====
export const cargueApiConfig = {
  // 🚀 ACTIVAR/DESACTIVAR INTEGRACIÓN CON API
  USAR_API: true, // ✅ ACTIVADO - Sincronización automática activa

  // 🚀 CONFIGURACIÓN DE TIMEOUTS
  TIMEOUT_CONEXION: 5000, // 5 segundos
  DEBOUNCE_SINCRONIZACION: 1000, // 1 segundo (reducido para respuesta más rápida)

  // 🚀 CONFIGURACIÓN DE REINTENTOS
  MAX_REINTENTOS: 3,
  INTERVALO_REINTENTO: 1000, // 1 segundo

  // 🚀 LOGS DE DEBUG
  DEBUG_LOGS: true,

  // 🚀 FUNCIÓN PARA ACTIVAR LA INTEGRACIÓN
  activarIntegracion: () => {
    cargueApiConfig.USAR_API = true;




  },

  // 🚀 FUNCIÓN PARA DESACTIVAR LA INTEGRACIÓN
  desactivarIntegracion: () => {
    cargueApiConfig.USAR_API = false;
    console.log('⚠️ API CARGUE: Integración DESACTIVADA');


  }
};

// ===== EXPORTACIÓN PRINCIPAL =====
const cargueServices = {
  api: cargueApiService,
  hybrid: cargueHybridService,
  config: cargueApiConfig
};

export default cargueServices;