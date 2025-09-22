// Utilidades para la integración con API del módulo Cargue
// NOTA: Estas utilidades están preparadas pero NO ACTIVAS todavía

import { cargueApiConfig } from '../services/cargueApiService';

// ===== UTILIDADES DE MIGRACIÓN =====
export const migracionUtils = {
  
  // 🚀 MIGRAR DATOS DE LOCALSTORAGE A SERVIDOR
  migrarDatosAServidor: async () => {
    if (!cargueApiConfig.USAR_API) {
      console.warn('⚠️ API no está activa, no se puede migrar');
      return { success: false, message: 'API no activa' };
    }

    try {
      console.log('🚀 MIGRACIÓN: Iniciando migración de localStorage a servidor...');
      
      // Obtener todas las claves de cargue
      const clavesCargue = Object.keys(localStorage).filter(key => key.startsWith('cargue_'));
      const clavesCumplimiento = Object.keys(localStorage).filter(key => key.startsWith('cumplimiento_'));
      
      console.log(`📊 MIGRACIÓN: Encontradas ${clavesCargue.length} claves de cargue y ${clavesCumplimiento.length} de cumplimiento`);
      
      let migrados = 0;
      let errores = 0;
      const erroresDetalle = [];

      // Migrar datos de cargue
      for (const clave of clavesCargue) {
        try {
          const datos = JSON.parse(localStorage.getItem(clave));
          
          if (datos && datos.productos && datos.productos.length > 0) {
            const { cargueApiService } = await import('../services/cargueApiService');
            
            const resultado = await cargueApiService.sincronizarDatosAlServidor(
              datos.dia,
              datos.idSheet,
              datos.fecha,
              datos.productos
            );
            
            if (resultado.success) {
              // Marcar como sincronizado
              datos.sincronizado = true;
              localStorage.setItem(clave, JSON.stringify(datos));
              migrados++;
              console.log(`✅ MIGRACIÓN: ${clave} migrado exitosamente`);
            } else {
              errores++;
              erroresDetalle.push(`${clave}: ${resultado.message}`);
              console.error(`❌ MIGRACIÓN: Error en ${clave}:`, resultado.message);
            }
          }
        } catch (error) {
          errores++;
          erroresDetalle.push(`${clave}: ${error.message}`);
          console.error(`❌ MIGRACIÓN: Error procesando ${clave}:`, error);
        }
      }

      // Migrar datos de cumplimiento
      for (const clave of clavesCumplimiento) {
        try {
          const cumplimiento = JSON.parse(localStorage.getItem(clave));
          const partes = clave.split('_'); // cumplimiento_DIA_ID_FECHA
          
          if (partes.length >= 4 && cumplimiento) {
            const [, dia, idSheet, fecha] = partes;
            
            const { cargueApiService } = await import('../services/cargueApiService');
            
            // Buscar si ya existe el registro
            const existente = await cargueApiService.cargarCumplimientoDesdeServidor(dia, idSheet, fecha);
            
            if (!existente.success) {
              // Crear nuevo registro
              const response = await fetch('http://localhost:8000/api/control-cumplimiento/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dia: dia.toUpperCase(),
                  id_sheet: idSheet,
                  fecha: fecha,
                  usuario: 'Migración',
                  ...cumplimiento
                })
              });
              
              if (response.ok) {
                migrados++;
                console.log(`✅ MIGRACIÓN: ${clave} (cumplimiento) migrado exitosamente`);
              } else {
                errores++;
                erroresDetalle.push(`${clave}: Error HTTP ${response.status}`);
              }
            } else {
              console.log(`⚠️ MIGRACIÓN: ${clave} ya existe en servidor`);
            }
          }
        } catch (error) {
          errores++;
          erroresDetalle.push(`${clave}: ${error.message}`);
          console.error(`❌ MIGRACIÓN: Error procesando ${clave}:`, error);
        }
      }

      const resultado = {
        success: errores === 0,
        migrados,
        errores,
        total: clavesCargue.length + clavesCumplimiento.length,
        erroresDetalle
      };

      console.log(`🎯 MIGRACIÓN COMPLETADA: ${migrados} migrados, ${errores} errores`);
      
      return resultado;

    } catch (error) {
      console.error('❌ MIGRACIÓN: Error general:', error);
      return {
        success: false,
        message: error.message,
        migrados: 0,
        errores: 1
      };
    }
  },

  // 🚀 VERIFICAR INTEGRIDAD DE DATOS
  verificarIntegridad: async () => {
    try {
      console.log('🔍 VERIFICACIÓN: Iniciando verificación de integridad...');
      
      const clavesCargue = Object.keys(localStorage).filter(key => key.startsWith('cargue_'));
      let verificados = 0;
      let inconsistencias = 0;
      const problemas = [];

      for (const clave of clavesCargue) {
        try {
          const datosLocal = JSON.parse(localStorage.getItem(clave));
          
          if (datosLocal && datosLocal.sincronizado) {
            // Verificar si existe en servidor
            const { cargueApiService } = await import('../services/cargueApiService');
            
            const datosServidor = await cargueApiService.cargarDatosDesdeServidor(
              datosLocal.dia,
              datosLocal.idSheet,
              datosLocal.fecha
            );
            
            if (datosServidor.success) {
              // Comparar datos básicos
              const productosLocal = datosLocal.productos.filter(p => p.cantidad > 0).length;
              const productosServidor = datosServidor.data.productos.filter(p => p.cantidad > 0).length;
              
              if (productosLocal !== productosServidor) {
                inconsistencias++;
                problemas.push(`${clave}: Local ${productosLocal} productos, Servidor ${productosServidor} productos`);
              }
              
              verificados++;
            } else {
              inconsistencias++;
              problemas.push(`${clave}: Marcado como sincronizado pero no existe en servidor`);
            }
          }
        } catch (error) {
          inconsistencias++;
          problemas.push(`${clave}: Error verificando - ${error.message}`);
        }
      }

      const resultado = {
        success: inconsistencias === 0,
        verificados,
        inconsistencias,
        problemas
      };

      console.log(`🎯 VERIFICACIÓN COMPLETADA: ${verificados} verificados, ${inconsistencias} inconsistencias`);
      
      return resultado;

    } catch (error) {
      console.error('❌ VERIFICACIÓN: Error general:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// ===== UTILIDADES DE DESARROLLO =====
export const devUtils = {
  
  // 🚀 ACTIVAR API TEMPORALMENTE (SOLO DESARROLLO)
  activarApiTemporal: () => {
    cargueApiConfig.USAR_API = true;
    cargueApiConfig.DEBUG_LOGS = true;
    console.log('🚀 DEV: API activada temporalmente');
    console.log('⚠️ DEV: Esto es solo para desarrollo, se resetea al recargar');
  },

  // 🚀 SIMULAR DATOS DEL SERVIDOR
  simularDatosServidor: (dia, idSheet, fecha) => {
    const datosSimulados = {
      dia,
      idSheet,
      fecha,
      productos: [
        {
          id: 1,
          producto: "AREPA TIPO OBLEA 500Gr",
          cantidad: 25,
          dctos: 2,
          adicional: 3,
          devoluciones: 1,
          vencidas: 0,
          total: 25,
          valor: 1625,
          neto: 40625,
          vendedor: true,
          despachador: false,
          lotesVencidos: []
        },
        {
          id: 2,
          producto: "AREPA MEDIANA 330Gr",
          cantidad: 30,
          dctos: 0,
          adicional: 5,
          devoluciones: 0,
          vencidas: 1,
          total: 34,
          valor: 1040,
          neto: 35360,
          vendedor: true,
          despachador: true,
          lotesVencidos: [
            { lote: "L001", motivo: "HONGO" }
          ]
        }
      ],
      timestamp: Date.now(),
      sincronizado: true,
      fromServer: true
    };

    const key = `cargue_${dia}_${idSheet}_${fecha}`;
    localStorage.setItem(key, JSON.stringify(datosSimulados));
    
    console.log(`🎭 DEV: Datos simulados creados para ${key}`);
    return datosSimulados;
  },

  // 🚀 LIMPIAR TODOS LOS DATOS DE CARGUE
  limpiarTodosLosDatos: () => {
    const claves = Object.keys(localStorage).filter(key => 
      key.startsWith('cargue_') || key.startsWith('cumplimiento_')
    );
    
    claves.forEach(clave => localStorage.removeItem(clave));
    
    console.log(`🧹 DEV: Eliminadas ${claves.length} claves de cargue`);
    return claves.length;
  },

  // 🚀 MOSTRAR ESTADÍSTICAS DE DATOS
  mostrarEstadisticas: () => {
    const clavesCargue = Object.keys(localStorage).filter(key => key.startsWith('cargue_'));
    const clavesCumplimiento = Object.keys(localStorage).filter(key => key.startsWith('cumplimiento_'));
    
    let totalProductos = 0;
    let totalSincronizados = 0;
    let totalNoSincronizados = 0;

    clavesCargue.forEach(clave => {
      try {
        const datos = JSON.parse(localStorage.getItem(clave));
        if (datos && datos.productos) {
          totalProductos += datos.productos.filter(p => p.cantidad > 0).length;
          if (datos.sincronizado) {
            totalSincronizados++;
          } else {
            totalNoSincronizados++;
          }
        }
      } catch (error) {
        // Ignorar errores
      }
    });

    const estadisticas = {
      registrosCargue: clavesCargue.length,
      registrosCumplimiento: clavesCumplimiento.length,
      totalProductos,
      sincronizados: totalSincronizados,
      noSincronizados: totalNoSincronizados,
      apiActiva: cargueApiConfig.USAR_API
    };

    console.table(estadisticas);
    return estadisticas;
  }
};

// ===== UTILIDADES DE FORMATO =====
export const formatUtils = {
  
  // 🚀 FORMATEAR DATOS PARA ENVÍO AL SERVIDOR
  formatearParaServidor: (datos) => {
    return {
      dia: datos.dia.toUpperCase(),
      fecha: datos.fecha,
      usuario: 'Sistema Web',
      productos: datos.productos.filter(p => 
        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 || 
        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
      ).map(p => ({
        producto_nombre: p.producto,
        vendedor_check: p.vendedor || false,
        despachador_check: p.despachador || false,
        cantidad: p.cantidad || 0,
        dctos: p.dctos || 0,
        adicional: p.adicional || 0,
        devoluciones: p.devoluciones || 0,
        vencidas: p.vencidas || 0,
        total: p.total || 0,
        valor: p.valor || 0,
        neto: p.neto || 0,
        lotes_vencidos: p.lotesVencidos || []
      }))
    };
  },

  // 🚀 FORMATEAR DATOS RECIBIDOS DEL SERVIDOR
  formatearDesdeServidor: (datosServidor) => {
    return {
      dia: datosServidor.dia,
      idSheet: `ID${datosServidor.vendedor}`,
      fecha: datosServidor.fecha,
      productos: datosServidor.productos.map(p => ({
        id: p.producto_id || Math.random(),
        producto: p.producto_nombre,
        cantidad: p.cantidad || 0,
        dctos: p.dctos || 0,
        adicional: p.adicional || 0,
        devoluciones: p.devoluciones || 0,
        vencidas: p.vencidas || 0,
        total: p.total || 0,
        valor: p.valor || 0,
        neto: p.neto || 0,
        vendedor: p.vendedor_check || false,
        despachador: p.despachador_check || false,
        lotesVencidos: p.lotes_vencidos || []
      })),
      timestamp: Date.now(),
      sincronizado: true,
      fromServer: true
    };
  }
};

// ===== EXPORTACIÓN PRINCIPAL =====
export default {
  migracion: migracionUtils,
  dev: devUtils,
  format: formatUtils
};