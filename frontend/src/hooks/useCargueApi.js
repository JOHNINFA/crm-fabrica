// Hook personalizado para integración con API del módulo Cargue
// NOTA: Este hook está preparado pero NO ACTIVO todavía

import { useState, useEffect, useCallback } from 'react';
import { cargueApiService, cargueHybridService, cargueApiConfig } from '../services/cargueApiService';

export const useCargueApi = (dia, idSheet, fechaSeleccionada) => {
  const [estado, setEstado] = useState({
    cargando: false,
    datos: null,
    error: null,
    conectado: false,
    fuente: null, // 'localStorage', 'servidor', 'ninguno'
    ultimaActualizacion: null
  });

  // 🚀 CARGAR DATOS AUTOMÁTICAMENTE
  const cargarDatos = useCallback(async () => {
    if (!cargueApiConfig.USAR_API || !dia || !idSheet || !fechaSeleccionada) {
      return;
    }

    setEstado(prev => ({ ...prev, cargando: true, error: null }));

    try {
      const resultado = await cargueHybridService.cargarDatos(dia, idSheet, fechaSeleccionada);

      setEstado(prev => ({
        ...prev,
        cargando: false,
        datos: resultado.success ? resultado.data : null,
        error: resultado.success ? null : resultado.message,
        fuente: resultado.source || 'ninguno',
        ultimaActualizacion: new Date()
      }));

      if (cargueApiConfig.DEBUG_LOGS) {
        console.log(`🔍 useCargueApi: Datos cargados desde ${resultado.source}`);
      }

      return resultado;

    } catch (error) {
      setEstado(prev => ({
        ...prev,
        cargando: false,
        error: error.message,
        fuente: 'error'
      }));

      if (cargueApiConfig.DEBUG_LOGS) {
        console.error('❌ useCargueApi: Error cargando datos:', error);
      }

      return { success: false, message: error.message };
    }
  }, [dia, idSheet, fechaSeleccionada]);

  // 🚀 GUARDAR DATOS
  const guardarDatos = useCallback(async (productos) => {
    if (!cargueApiConfig.USAR_API || !dia || !idSheet || !fechaSeleccionada) {
      return { success: false, message: 'API no activa o parámetros faltantes' };
    }

    try {
      const resultado = await cargueHybridService.guardarDatos(dia, idSheet, fechaSeleccionada, productos);

      if (cargueApiConfig.DEBUG_LOGS) {
        console.log(`📤 useCargueApi: Datos guardados - ${resultado.message}`);
      }

      return resultado;

    } catch (error) {
      if (cargueApiConfig.DEBUG_LOGS) {
        console.error('❌ useCargueApi: Error guardando datos:', error);
      }

      return { success: false, message: error.message };
    }
  }, [dia, idSheet, fechaSeleccionada]);

  // 🚀 VERIFICAR CONEXIÓN
  const verificarConexion = useCallback(async () => {
    if (!cargueApiConfig.USAR_API) {
      return { success: false, message: 'API no activa' };
    }

    try {
      const resultado = await cargueApiService.verificarConexion();

      setEstado(prev => ({
        ...prev,
        conectado: resultado.success,
        error: resultado.success ? null : resultado.message
      }));

      return resultado;

    } catch (error) {
      setEstado(prev => ({
        ...prev,
        conectado: false,
        error: error.message
      }));

      return { success: false, message: error.message };
    }
  }, []);

  // 🚀 SINCRONIZAR DATOS PENDIENTES
  const sincronizarPendientes = useCallback(async () => {
    if (!cargueApiConfig.USAR_API) {
      return { success: false, message: 'API no activa' };
    }

    try {
      // Buscar datos no sincronizados en localStorage
      const claves = Object.keys(localStorage).filter(key => key.startsWith('cargue_'));
      const datosPendientes = [];

      for (const clave of claves) {
        try {
          const datos = JSON.parse(localStorage.getItem(clave));
          if (datos && !datos.sincronizado) {
            datosPendientes.push({ clave, datos });
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }

      if (datosPendientes.length === 0) {
        return { success: true, message: 'No hay datos pendientes de sincronización' };
      }

      let sincronizados = 0;
      let errores = 0;

      for (const { clave, datos } of datosPendientes) {
        try {
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
            sincronizados++;
          } else {
            errores++;
          }
        } catch (error) {
          errores++;
        }
      }

      const mensaje = `Sincronizados: ${sincronizados}, Errores: ${errores}`;

      if (cargueApiConfig.DEBUG_LOGS) {
        console.log(`🔄 useCargueApi: ${mensaje}`);
      }

      return {
        success: errores === 0,
        message: mensaje,
        sincronizados,
        errores
      };

    } catch (error) {
      if (cargueApiConfig.DEBUG_LOGS) {
        console.error('❌ useCargueApi: Error sincronizando pendientes:', error);
      }

      return { success: false, message: error.message };
    }
  }, []);

  // 🚀 CARGAR DATOS AUTOMÁTICAMENTE AL CAMBIAR PARÁMETROS
  useEffect(() => {
    if (cargueApiConfig.USAR_API && dia && idSheet && fechaSeleccionada) {
      cargarDatos();
    }
  }, [dia, idSheet, fechaSeleccionada, cargarDatos]);

  // 🚀 VERIFICAR CONEXIÓN AL MONTAR
  useEffect(() => {
    if (cargueApiConfig.USAR_API) {
      verificarConexion();
    }
  }, [verificarConexion]);

  return {
    // Estado
    ...estado,
    
    // Métodos
    cargarDatos,
    guardarDatos,
    verificarConexion,
    sincronizarPendientes,
    
    // Configuración
    apiActiva: cargueApiConfig.USAR_API,
    
    // Utilidades
    reintentar: cargarDatos,
    limpiarError: () => setEstado(prev => ({ ...prev, error: null }))
  };
};

// 🚀 HOOK PARA ESTADO DE CONEXIÓN GLOBAL
export const useCargueApiStatus = () => {
  const [estadoGlobal, setEstadoGlobal] = useState({
    conectado: false,
    ultimaVerificacion: null,
    error: null
  });

  const verificarEstadoGlobal = useCallback(async () => {
    if (!cargueApiConfig.USAR_API) {
      return;
    }

    try {
      const resultado = await cargueApiService.verificarConexion();
      
      setEstadoGlobal({
        conectado: resultado.success,
        ultimaVerificacion: new Date(),
        error: resultado.success ? null : resultado.message
      });

    } catch (error) {
      setEstadoGlobal({
        conectado: false,
        ultimaVerificacion: new Date(),
        error: error.message
      });
    }
  }, []);

  // Verificar cada 30 segundos si la API está activa
  useEffect(() => {
    if (cargueApiConfig.USAR_API) {
      verificarEstadoGlobal();
      
      const interval = setInterval(verificarEstadoGlobal, 30000);
      return () => clearInterval(interval);
    }
  }, [verificarEstadoGlobal]);

  return {
    ...estadoGlobal,
    verificar: verificarEstadoGlobal,
    apiActiva: cargueApiConfig.USAR_API
  };
};

export default useCargueApi;